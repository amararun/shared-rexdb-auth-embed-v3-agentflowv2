import { flowiseEndpoints, defaultEndpoint } from '@/config/endpoints';

// Type for an endpoint
export type FlowiseEndpoint = {
  id: number;
  name: string;
  url: string;
  description: string;
  type: string;  // This will now accept any string value
  quality: number;
  cost: string;
};

// Create a proxy handler to intercept URL access
const handler = {
  get(_target: { currentEndpoint: FlowiseEndpoint }, prop: string) {
    if (prop === 'url') {
      const url = EndpointStore.getInstance().currentEndpoint.url;
      console.log('Getting endpoint URL:', url);
      return url;
    }
    const value = EndpointStore.getInstance().currentEndpoint[prop as keyof FlowiseEndpoint];
    console.log(`Getting endpoint property ${prop}:`, value);
    return value;
  },
  set(target: { currentEndpoint: FlowiseEndpoint }, prop: string, value: any) {
    if (prop === 'currentEndpoint') {
      console.log('Setting new endpoint:', value);
      target.currentEndpoint = value;
      return true;
    }
    return false;
  }
};

class EndpointStore {
  private static instance: EndpointStore;
  private _currentEndpoint: FlowiseEndpoint;
  private _proxy: any;

  private constructor() {
    this._currentEndpoint = defaultEndpoint as FlowiseEndpoint;
    this._proxy = new Proxy({ currentEndpoint: this._currentEndpoint }, handler);
  }

  public static getInstance(): EndpointStore {
    if (!EndpointStore.instance) {
      EndpointStore.instance = new EndpointStore();
    }
    return EndpointStore.instance;
  }

  public get currentEndpoint(): FlowiseEndpoint {
    return this._currentEndpoint;
  }

  public get proxy(): any {
    return this._proxy;
  }

  public setEndpoint(endpointId: number): void {
    console.log('setEndpoint called with ID:', endpointId);
    const endpoint = flowiseEndpoints.find(e => e.id === endpointId) as FlowiseEndpoint;
    if (endpoint) {
      console.log('Found endpoint:', endpoint);
      this._currentEndpoint = endpoint;
      this._proxy.currentEndpoint = endpoint;
      
      // Dispatch an event to notify components of the change
      window.dispatchEvent(new CustomEvent('endpointChanged', {
        detail: { endpoint }
      }));
      console.log('Dispatched endpointChanged event');
    } else {
      console.warn('Endpoint not found for ID:', endpointId);
    }
  }

  public getAllEndpoints(): FlowiseEndpoint[] {
    return flowiseEndpoints as FlowiseEndpoint[];
  }

  // Initialize with default endpoint
  public initializeFromStorage(): void {
    console.log('Initializing with default endpoint:', defaultEndpoint);
    this._currentEndpoint = defaultEndpoint as FlowiseEndpoint;
    this._proxy.currentEndpoint = defaultEndpoint;
  }
}

// Create and initialize the store
const store = EndpointStore.getInstance();
store.initializeFromStorage();

// Export the singleton instance
export const endpointStore = store;

// Export the proxy that will be used in place of the direct API endpoint
export const flowiseAdvAnalystEndpoint = store.proxy; 