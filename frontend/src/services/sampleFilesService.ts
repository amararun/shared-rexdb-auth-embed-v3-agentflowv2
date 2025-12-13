import { logService } from './logService';

// Extended File interface to carry original/uncompressed size for display purposes
export interface FileWithOriginalSize extends File {
  originalSize?: number; // Original uncompressed size in bytes (for GZ files)
}

export type SampleFile = {
  name: string;
  displayName?: string; // User-friendly name without file extension
  size: string;
  rowCount: number;
  rowCountDisplay?: string; // e.g., "1.6 million", "5.2 million"
  columnCount: number;
  description: string;
  analysisPrompt?: string;
  // Remote file support (Google Drive, GitHub)
  fileFormat?: 'standard' | 'zip' | 'gz';
  source?: 'local' | 'google_drive' | 'github_release';
  googleDriveId?: string;
  githubReleaseUrl?: string; // Direct download URL from GitHub releases
  sizeZipped?: string;
  sizeUnzipped?: string;
  sizeCompressed?: string; // For gz files
  extractedFileName?: string;
  originalFileName?: string; // Original filename before .gz compression
};

export async function getSampleFiles(): Promise<SampleFile[]> {
  try {
    // Fetch the list of files from the sample_files directory
    const response = await fetch('/sample_files/index.json');
    if (!response.ok) {
      throw new Error('Failed to fetch sample files list');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading sample files:', error);
    // Fallback to static files if dynamic loading fails
    return [
      {
        name: "ICICI_BLUECHIP_SEP_DEC_2024.txt",
        size: "6.8 KB",
        rowCount: 82,
        columnCount: 8,
        description: "This data is monthly portfolio holdings disclosure of ICICI Prudential MF for September and December 2024, with market value and quantities of each instrument at the end of each month."
      },
      {
        name: "RBI_CARDS_ATM_POS_DEC2024.txt",
        size: "14 KB",
        rowCount: 66,
        columnCount: 28,
        description: "This is Reserve Bank of India's monthly statistics report on ATMs, credit cards, debit cards, and POS transactions. The dataset provided is for December 2024."
      }
    ];
  }
}

export async function getSampleFile(filename: string, fileMetadata?: SampleFile): Promise<File> {
  try {
    // Handle GitHub Release files
    if (fileMetadata?.source === 'github_release' && fileMetadata?.githubReleaseUrl) {
      return await getSampleFileFromGitHub(fileMetadata);
    }

    // Handle Google Drive files
    if (fileMetadata?.source === 'google_drive' && fileMetadata?.googleDriveId) {
      return await getSampleFileFromGoogleDrive(fileMetadata);
    }

    // Handle local files (existing logic)
    const response = await fetch(`/sample_files/${filename}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sample file');
    }
    const blob = await response.blob();
    return new File([blob], filename, {
      type: 'text/plain'
    });
  } catch (error) {
    console.error('Error fetching sample file:', error);
    throw error;
  }
}

async function getSampleFileFromGitHub(fileMetadata: SampleFile): Promise<File> {
  logService.info('Starting GitHub Release download:', {
    fileName: fileMetadata.name,
    url: fileMetadata.githubReleaseUrl,
    fileFormat: fileMetadata.fileFormat
  });

  console.log('[SampleFilesService] Starting GitHub Release download:', {
    fileName: fileMetadata.name,
    url: fileMetadata.githubReleaseUrl,
    fileFormat: fileMetadata.fileFormat
  });

  if (!fileMetadata.githubReleaseUrl) {
    throw new Error('GitHub release URL is required');
  }

  // Use proxy for local dev (Vite proxy) or production (Vercel API route)
  // GitHub releases have CORS restrictions, so we need a proxy
  const downloadUrl = `/api/proxy-github-release?url=${encodeURIComponent(fileMetadata.githubReleaseUrl)}`;

  console.log('[SampleFilesService] Fetching via proxy:', downloadUrl);

  // Download via proxy (Vite proxy in dev, Vercel API route in production)
  const response = await fetch(downloadUrl, {
    method: 'GET',
    redirect: 'follow'
  });
  
  console.log('[SampleFilesService] Response received:', {
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('Content-Type'),
    contentLength: response.headers.get('Content-Length')
  });

  if (!response.ok) {
    // Try to get error details from response
    let errorMessage = `Failed to download file from GitHub: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      console.error('[SampleFilesService] Error response:', errorData);
    } catch (e) {
      // Response is not JSON, use status text
    }
    throw new Error(errorMessage);
  }

  // Check if response is JSON (error) before converting to blob
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    const errorData = await response.json();
    console.error('[SampleFilesService] Proxy returned error JSON:', errorData);
    throw new Error(errorData.error || 'Failed to download from GitHub');
  }

  const blob = await response.blob();
  console.log('[SampleFilesService] Blob received:', {
    size: blob.size,
    sizeKB: (blob.size / 1024).toFixed(2),
    sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
    type: blob.type
  });

  // Handle GZ files - already compressed, return as-is for direct upload
  if (fileMetadata.fileFormat === 'gz') {
    // Validate it's a gzip file by checking magic bytes (1f 8b)
    const arrayBuffer = await blob.slice(0, 2).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const isGzip = uint8Array[0] === 0x1f && uint8Array[1] === 0x8b;

    console.log('[SampleFilesService] GZ validation:', {
      firstBytes: Array.from(uint8Array).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '),
      isGzip,
      expectedFormat: 'GZIP'
    });

    if (!isGzip) {
      const textBlob = blob.slice(0, 500);
      const text = await textBlob.text();
      console.error('[SampleFilesService] Invalid GZIP file - content preview:', text.substring(0, 200));
      throw new Error('Downloaded file is not a valid GZIP file.');
    }

    // Parse original uncompressed size from metadata (e.g., "1.6 GB", "697 MB")
    let originalSizeBytes: number | undefined;
    if (fileMetadata.size) {
      const sizeMatch = fileMetadata.size.match(/^([\d.]+)\s*(KB|MB|GB)$/i);
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        if (unit === 'KB') originalSizeBytes = value * 1024;
        else if (unit === 'MB') originalSizeBytes = value * 1024 * 1024;
        else if (unit === 'GB') originalSizeBytes = value * 1024 * 1024 * 1024;
      }
    }

    logService.info('GZIP file downloaded from GitHub', {
      fileName: fileMetadata.name,
      compressedSize: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
      originalSize: fileMetadata.size,
      originalFileName: fileMetadata.originalFileName
    });

    // Return as gzip file - the backend will decompress it
    // Use originalFileName (without .gz) for the file name sent to backend
    const fileName = fileMetadata.originalFileName || fileMetadata.name.replace(/\.gz$/, '');
    const file = new File([blob], fileName + '.gz', {
      type: 'application/gzip'
    }) as FileWithOriginalSize;

    // Attach original uncompressed size for display purposes
    if (originalSizeBytes) {
      file.originalSize = originalSizeBytes;
    }

    return file;
  }

  // Handle ZIP files
  if (fileMetadata.fileFormat === 'zip') {
    // Check if blob is actually a ZIP file by reading first bytes
    const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const isZIP = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B; // ZIP magic bytes: "PK"
    
    console.log('[SampleFilesService] ZIP validation:', {
      firstBytes: Array.from(uint8Array).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '),
      isZIP,
      expectedFormat: 'ZIP'
    });

    if (!isZIP) {
      // Try to read as text to see what we actually got
      const textBlob = blob.slice(0, 500);
      const text = await textBlob.text();
      console.error('[SampleFilesService] Invalid ZIP file - content preview:', text.substring(0, 200));
      
      logService.error('Downloaded file is not a valid ZIP', {
        blobSize: blob.size,
        firstBytes: Array.from(uint8Array.slice(0, 4)).map(b => `0x${b.toString(16)}`).join(' '),
        contentPreview: text.substring(0, 200)
      });
      
      if (text.toLowerCase().includes('html') || text.toLowerCase().includes('github')) {
        throw new Error('Received HTML page instead of ZIP file. The proxy may not be working correctly.');
      }
      throw new Error('Downloaded file is not a valid ZIP file.');
    }

    console.log('[SampleFilesService] Loading ZIP file...');
    const JSZip = (await import('jszip')).default;
    let zip;
    
    try {
      zip = await JSZip.loadAsync(blob);
      const fileCount = Object.keys(zip.files).length;
      logService.info('ZIP file loaded successfully', {
        fileCount,
        totalSize: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
      });
      
      const allFiles = Object.keys(zip.files);
      console.log('[SampleFilesService] ZIP loaded successfully:', {
        fileCount,
        files: allFiles.slice(0, 10),
        totalFiles: allFiles.length
      });
      
      // Log all files if there are only a few (helps with debugging)
      if (allFiles.length <= 5) {
        console.log('[SampleFilesService] All files in ZIP:', allFiles);
      }
    } catch (zipError) {
      console.error('[SampleFilesService] ZIP extraction error:', {
        error: zipError instanceof Error ? zipError.message : String(zipError),
        blobSize: blob.size
      });
      throw new Error(`Failed to extract ZIP file: ${zipError instanceof Error ? zipError.message : 'Unknown error'}`);
    }

    // Find the specified file or first CSV/TXT file
    let targetFile = fileMetadata.extractedFileName;

    if (!targetFile) {
      // Find first CSV or TXT file
      targetFile = Object.keys(zip.files).find(name =>
        !zip.files[name].dir && (name.endsWith('.csv') || name.endsWith('.txt'))
      );
    }

    if (!targetFile) {
      console.error('[SampleFilesService] No target file found in ZIP:', {
        availableFiles: Object.keys(zip.files)
      });
      throw new Error('No CSV/TXT file found in ZIP');
    }

    console.log('[SampleFilesService] Extracting file from ZIP:', targetFile);
    console.log('[SampleFilesService] Available files in ZIP:', Object.keys(zip.files));

    // Verify file exists before extracting
    if (!zip.files[targetFile]) {
      const availableFiles = Object.keys(zip.files);
      console.error('[SampleFilesService] File not found in ZIP:', {
        requested: targetFile,
        availableFiles
      });
      throw new Error(`File "${targetFile}" not found in ZIP. Available files: ${availableFiles.join(', ')}`);
    }

    const fileEntry = zip.files[targetFile];
    if (fileEntry.dir) {
      throw new Error(`"${targetFile}" is a directory, not a file`);
    }

    // Extract the file
    const extractedBlob = await fileEntry.async('blob');
    
    const extractedSizeMB = (extractedBlob.size / (1024 * 1024)).toFixed(2);
    logService.info('File extracted from ZIP', {
      fileName: targetFile,
      size: `${extractedSizeMB} MB`
    });
    
    console.log('[SampleFilesService] File extracted:', {
      fileName: targetFile,
      size: extractedBlob.size,
      sizeMB: extractedSizeMB
    });

    // Return as File object
    return new File([extractedBlob], targetFile, {
      type: 'text/plain'
    });
  }

  // Non-ZIP GitHub file
  console.log('[SampleFilesService] Returning non-ZIP file:', {
    fileName: fileMetadata.name,
    size: blob.size
  });

  return new File([blob], fileMetadata.name, {
    type: 'text/plain'
  });
}

async function getSampleFileFromGoogleDrive(fileMetadata: SampleFile): Promise<File> {
  logService.info('Starting Google Drive download:', {
    fileName: fileMetadata.name,
    fileId: fileMetadata.googleDriveId,
    fileFormat: fileMetadata.fileFormat
  });
  
  console.log('[SampleFilesService] Starting Google Drive download:', {
    fileName: fileMetadata.name,
    fileId: fileMetadata.googleDriveId,
    fileFormat: fileMetadata.fileFormat,
    extractedFileName: fileMetadata.extractedFileName
  });

  // Use proxy endpoint to bypass CORS (works locally with Vercel dev and in production)
  const downloadUrl = `/api/proxy-google-drive?fileId=${fileMetadata.googleDriveId}`;

  console.log('[SampleFilesService] Fetching from proxy:', downloadUrl);

  // Download file from Google Drive via proxy
  const response = await fetch(downloadUrl);
  
  console.log('[SampleFilesService] Response received:', {
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('Content-Type'),
    contentLength: response.headers.get('Content-Length')
  });

  if (!response.ok) {
    // Try to get error details from response
    let errorMessage = 'Failed to download file from Google Drive';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      console.error('[SampleFilesService] Error response:', errorData);
    } catch (e) {
      // Response is not JSON, use status text
      errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  console.log('[SampleFilesService] Blob received:', {
    size: blob.size,
    sizeKB: (blob.size / 1024).toFixed(2),
    sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
    type: blob.type
  });

  // Validate ZIP file before extraction
  if (fileMetadata.fileFormat === 'zip') {
    // Check if blob is actually a ZIP file by reading first bytes
    const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const isZIP = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B; // ZIP magic bytes: "PK"
    
    console.log('[SampleFilesService] ZIP validation:', {
      firstBytes: Array.from(uint8Array).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '),
      isZIP,
      expectedFormat: 'ZIP'
    });

    if (!isZIP) {
      // Try to read as text to see if it's HTML
      const textBlob = blob.slice(0, 500);
      const text = await textBlob.text();
      console.error('[SampleFilesService] Invalid ZIP file - content preview:', text.substring(0, 200));
      
      if (text.toLowerCase().includes('html') || text.toLowerCase().includes('google drive')) {
        logService.error('Google Drive returned HTML instead of ZIP file', {
          preview: text.substring(0, 200),
          hint: 'File may require virus scan confirmation'
        });
        throw new Error('Received HTML page instead of ZIP file. Google Drive may be showing a virus scan warning. Please ensure the file is publicly accessible.');
      }
      logService.error('Downloaded file is not a valid ZIP', {
        blobSize: blob.size,
        firstBytes: Array.from(uint8Array.slice(0, 4)).map(b => `0x${b.toString(16)}`).join(' ')
      });
      throw new Error('Downloaded file is not a valid ZIP file. Expected ZIP format but received different content.');
    }

    console.log('[SampleFilesService] Loading ZIP file...');
    const JSZip = (await import('jszip')).default;
    let zip;
    
    try {
      zip = await JSZip.loadAsync(blob);
    const fileCount = Object.keys(zip.files).length;
    logService.info('ZIP file loaded successfully', {
      fileCount,
      totalSize: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
    });
    
    console.log('[SampleFilesService] ZIP loaded successfully:', {
      fileCount,
      files: Object.keys(zip.files).slice(0, 10) // First 10 files
    });
    } catch (zipError) {
      console.error('[SampleFilesService] ZIP extraction error:', {
        error: zipError instanceof Error ? zipError.message : String(zipError),
        blobSize: blob.size
      });
      throw new Error(`Failed to extract ZIP file: ${zipError instanceof Error ? zipError.message : 'Unknown error'}`);
    }

    // Find the specified file or first CSV/TXT file
    let targetFile = fileMetadata.extractedFileName;

    if (!targetFile) {
      // Find first CSV or TXT file
      targetFile = Object.keys(zip.files).find(name =>
        !zip.files[name].dir && (name.endsWith('.csv') || name.endsWith('.txt'))
      );
    }

    if (!targetFile) {
      console.error('[SampleFilesService] No target file found in ZIP:', {
        availableFiles: Object.keys(zip.files)
      });
      throw new Error('No CSV/TXT file found in ZIP');
    }

    console.log('[SampleFilesService] Extracting file from ZIP:', targetFile);
    console.log('[SampleFilesService] Available files in ZIP:', Object.keys(zip.files));

    // Verify file exists before extracting
    if (!zip.files[targetFile]) {
      const availableFiles = Object.keys(zip.files);
      console.error('[SampleFilesService] File not found in ZIP:', {
        requested: targetFile,
        availableFiles
      });
      throw new Error(`File "${targetFile}" not found in ZIP. Available files: ${availableFiles.join(', ')}`);
    }

    const fileEntry = zip.files[targetFile];
    if (fileEntry.dir) {
      throw new Error(`"${targetFile}" is a directory, not a file`);
    }

    // Extract the file
    const extractedBlob = await fileEntry.async('blob');
    
    const extractedSizeMB = (extractedBlob.size / (1024 * 1024)).toFixed(2);
    logService.info('File extracted from ZIP', {
      fileName: targetFile,
      size: `${extractedSizeMB} MB`
    });
    
    console.log('[SampleFilesService] File extracted:', {
      fileName: targetFile,
      size: extractedBlob.size,
      sizeMB: extractedSizeMB
    });

    // Return as File object
    return new File([extractedBlob], targetFile, {
      type: 'text/plain'
    });
  }

  // Non-ZIP Google Drive file
  console.log('[SampleFilesService] Returning non-ZIP file:', {
    fileName: fileMetadata.name,
    size: blob.size
  });

  return new File([blob], fileMetadata.name, {
    type: 'text/plain'
  });
} 