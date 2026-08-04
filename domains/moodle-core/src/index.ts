// DDD primitives now live in @rpe/domain-kit; re-export for convenience so
// consumers can import Result/AggregateRoot/etc. from the domain package too.
export * from '@rpe/domain-kit'
export * from './identity/index.js'
export * from './course/index.js'
export * from './enrollment/index.js'
export * from './activity/index.js'
export * from './grading/index.js'
export * from './auth/index.js'
export * from './notification/index.js'
