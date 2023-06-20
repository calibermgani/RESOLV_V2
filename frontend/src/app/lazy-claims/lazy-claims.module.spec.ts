import { LazyClaimsModule } from './lazy-claims.module';

describe('LazyClaimsModule', () => {
  let lazyClaimsModule: LazyClaimsModule;

  beforeEach(() => {
    lazyClaimsModule = new LazyClaimsModule();
  });

  it('should create an instance', () => {
    expect(lazyClaimsModule).toBeTruthy();
  });
});
