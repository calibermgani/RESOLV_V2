import { ClaimOpFooterModule } from './claim-op-footer.module';

describe('ClaimOpFooterModule', () => {
  let claimOpFooterModule: ClaimOpFooterModule;

  beforeEach(() => {
    claimOpFooterModule = new ClaimOpFooterModule();
  });

  it('should create an instance', () => {
    expect(claimOpFooterModule).toBeTruthy();
  });
});
