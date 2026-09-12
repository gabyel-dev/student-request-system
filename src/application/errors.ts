export class UnauthorizedDomainError extends Error {
  constructor() {
    super('only @paterostechnologicalcollege.edu.ph emails are allowed')
    this.name = 'UnauthorizedDomainError'
  }
}
