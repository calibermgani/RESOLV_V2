import { CommonModuleModule } from './common-module.module';

describe('CommonModuleModule', () => {
  let commonModuleModule: CommonModuleModule;

  beforeEach(() => {
    commonModuleModule = new CommonModuleModule();
  });

  it('should create an instance', () => {
    expect(commonModuleModule).toBeTruthy();
  });
});
