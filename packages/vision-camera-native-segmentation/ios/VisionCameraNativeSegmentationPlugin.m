#import <CoreImage/CoreImage.h>
#import <ImageIO/CGImageProperties.h>
#import <UIKit/UIKit.h>
#import <Vision/Vision.h>
#import <VisionCamera/Frame.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

@interface VisionCameraNativeSegmentationPlugin : FrameProcessorPlugin
@end

@implementation VisionCameraNativeSegmentationPlugin

- (instancetype)initWithProxy:(VisionCameraProxyHolder *)proxy options:(NSDictionary *)options {
  return [super initWithProxy:proxy withOptions:options];
}

static CGImagePropertyOrientation VNImageOrientationFromUIImageOrientation(UIImageOrientation o) {
  switch (o) {
    case UIImageOrientationUp:
      return kCGImagePropertyOrientationUp;
    case UIImageOrientationDown:
      return kCGImagePropertyOrientationDown;
    case UIImageOrientationLeft:
      return kCGImagePropertyOrientationLeft;
    case UIImageOrientationRight:
      return kCGImagePropertyOrientationRight;
    case UIImageOrientationUpMirrored:
      return kCGImagePropertyOrientationUpMirrored;
    case UIImageOrientationDownMirrored:
      return kCGImagePropertyOrientationDownMirrored;
    case UIImageOrientationLeftMirrored:
      return kCGImagePropertyOrientationLeftMirrored;
    case UIImageOrientationRightMirrored:
      return kCGImagePropertyOrientationRightMirrored;
    default:
      return kCGImagePropertyOrientationUp;
  }
}

+ (UIImage *)downscaleAndInvertMask:(CVPixelBufferRef)maskPB maxDimension:(CGFloat)maxDim {
  CIImage *ci = [CIImage imageWithCVPixelBuffer:maskPB];
  CGFloat w = CVPixelBufferGetWidth(maskPB);
  CGFloat h = CVPixelBufferGetHeight(maskPB);
  CGFloat scale = maxDim / MAX(w, h);
  if (scale > 1.0) {
    scale = 1.0;
  }
  CIImage *scaled = [ci imageByApplyingTransform:CGAffineTransformMakeScale(scale, scale)];

  CIFilter *invert = [CIFilter filterWithName:@"CIColorInvert"];
  [invert setValue:scaled forKey:kCIInputImageKey];
  CIImage *inv = invert.outputImage;
  if (inv == nil) {
    return nil;
  }

  CIContext *ctx = [CIContext context];
  CGRect extent = inv.extent;
  CGImageRef cg = [ctx createCGImage:inv fromRect:extent];
  if (cg == NULL) {
    return nil;
  }
  UIImage *img = [UIImage imageWithCGImage:cg scale:1.0 orientation:UIImageOrientationUp];
  CGImageRelease(cg);
  return img;
}

- (id)callback:(Frame *)frame withArguments:(NSDictionary *)arguments {
  if (@available(iOS 15.0, *)) {
    CMSampleBufferRef sampleBuffer = frame.buffer;
    if (sampleBuffer == NULL) {
      return @{@"error" : @"no sample buffer"};
    }
    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    if (pixelBuffer == NULL) {
      return @{@"error" : @"no pixel buffer"};
    }

    CGImagePropertyOrientation orient = VNImageOrientationFromUIImageOrientation(frame.orientation);
    VNImageRequestHandler *handler =
        [[VNImageRequestHandler alloc] initWithCVPixelBuffer:pixelBuffer orientation:orient options:@{}];
    VNGeneratePersonSegmentationRequest *request = [[VNGeneratePersonSegmentationRequest alloc] init];
    request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelBalanced;

    NSError *error = nil;
    BOOL ok = [handler performRequests:@[ request ] error:&error];
    if (!ok || error != nil) {
      return @{@"error" : (error.localizedDescription ?: @"vision failed")};
    }

    VNPixelBufferObservation *obs = request.results.firstObject;
    if (obs == nil) {
      return @{@"error" : @"no segmentation"};
    }

    CVPixelBufferRef maskPB = obs.pixelBuffer;
    UIImage *maskImg = [VisionCameraNativeSegmentationPlugin downscaleAndInvertMask:maskPB maxDimension:240.0];
    if (maskImg == nil) {
      return @{@"error" : @"encode failed"};
    }

    NSData *png = UIImagePNGRepresentation(maskImg);
    if (png == nil) {
      return @{@"error" : @"png failed"};
    }

    NSString *b64 = [png base64EncodedStringWithOptions:0];
    return @{
      @"maskBase64" : b64,
      @"maskWidth" : @(maskImg.size.width * maskImg.scale),
      @"maskHeight" : @(maskImg.size.height * maskImg.scale)
    };
  }
  return @{@"error" : @"requires iOS 15+"};
}

VISION_EXPORT_FRAME_PROCESSOR(VisionCameraNativeSegmentationPlugin, nativePersonSegment)

@end
