import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parsePipeDelimitedText(content: string) {
  const lines = content.trim().split('\n')
  const headers = lines[0].split('|').map(header => header.trim())
  
  const data = lines.slice(1).map(line => {
    const values = line.split('|').map(value => value.trim())
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index]
      return obj
    }, {} as Record<string, string>)
  })

  return { headers, data }
}

/**
 * Format a number with comma separators (e.g., 1000000 -> "1,000,000")
 */
export function formatNumberWithCommas(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * Format duration in seconds to a human-readable string
 * Examples: 30 -> "30 seconds", 90 -> "1 minute 30 seconds", 600 -> "10 minutes"
 * Always rounds to whole seconds (no decimals)
 */
export function formatDuration(seconds: number): string {
  // Round to whole seconds
  const wholeSeconds = Math.round(seconds)
  
  if (wholeSeconds < 60) {
    return `${wholeSeconds} second${wholeSeconds !== 1 ? 's' : ''}`
  }
  
  const minutes = Math.floor(wholeSeconds / 60)
  const remainingSeconds = wholeSeconds % 60
  
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`
}

/**
 * Format file size in bytes to MB with 1 decimal place
 * Examples: 1048576 -> "1.0 MB", 52428800 -> "50.0 MB", 734003200 -> "700.0 MB"
 */
export function formatFileSizeMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}