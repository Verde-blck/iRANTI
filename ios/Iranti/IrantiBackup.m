#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(IrantiBackup, NSObject)

RCT_EXTERN_METHOD(save:(NSString *)fileName contents:(NSString *)contents resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(open:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
