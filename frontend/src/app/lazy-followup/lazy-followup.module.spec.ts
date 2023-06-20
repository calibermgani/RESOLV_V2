import { LazyFollowupModule } from './lazy-followup.module';

describe('LazyFollowupModule', () => {
  let lazyFollowupModule: LazyFollowupModule;

  beforeEach(() => {
    lazyFollowupModule = new LazyFollowupModule();
  });

  it('should create an instance', () => {
    expect(lazyFollowupModule).toBeTruthy();
  });
});
