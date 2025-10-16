/**
 * @arp0d3v/lds-angular
 * Angular components and directives for @arp0d3v/lds-core
 * 
 * @author Arash Pouya (arp0d3v)
 * @license MIT
 */

// Re-export everything from lds-core for convenience
export * from '@arp0d3v/lds-core';

// Export Angular-specific components
export * from './components';
export * from './directives';
export * from './module';

// Export provider (note: requires custom implementation in app)
// Users will create their own AppListDataSourceProvider
// See documentation for examples

