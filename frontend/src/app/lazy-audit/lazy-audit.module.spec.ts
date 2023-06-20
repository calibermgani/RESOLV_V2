import { LazyAuditModule } from './lazy-audit.module';

describe('LazyAuditModule', () => {
  let lazyAuditModule: LazyAuditModule;

  beforeEach(() => {
    lazyAuditModule = new LazyAuditModule();
  });

  it('should create an instance', () => {
    expect(lazyAuditModule).toBeTruthy();
  });
});
