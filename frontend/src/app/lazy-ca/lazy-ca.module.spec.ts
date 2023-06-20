import { LazyCAModule } from './lazy-ca.module';

describe('LazyCAModule', () => {
  let lazyCAModule: LazyCAModule;

  beforeEach(() => {
    lazyCAModule = new LazyCAModule();
  });

  it('should create an instance', () => {
    expect(lazyCAModule).toBeTruthy();
  });
});
