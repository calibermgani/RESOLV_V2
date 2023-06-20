import { LazyClaimOpFooterModule } from './lazy-claim-op-footer.module';

describe('LazyClaimsModule', () => {
  let lazyClaimOpFooterModule: LazyClaimOpFooterModule;

  beforeEach(() => {
    lazyClaimOpFooterModule = new LazyClaimOpFooterModule();
  });

  it('should create an instance', () => {
    expect(lazyClaimOpFooterModule).toBeTruthy();
  });
});
