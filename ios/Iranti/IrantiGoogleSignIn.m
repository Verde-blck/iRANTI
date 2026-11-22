#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(IrantiGoogleSignIn, NSObject)

RCT_EXTERN_METHOD(signIn:(NSString *)webClientId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(signOut:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
