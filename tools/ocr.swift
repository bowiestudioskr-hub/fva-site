// 그림 속 글자를 줄 단위로 뽑는다 (macOS Vision, 한국어). 쓰임: swift tools/ocr.swift 그림.jpg
import Foundation
import Vision
import AppKit
let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(2) }
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.recognitionLanguages = ["ko-KR", "en-US"]
req.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: cg).perform([req])
// 위→아래, 같은 줄이면 왼→오른 순서로. 한 줄로 묶어 "|" 로 칸을 나눈다.
let obs = (req.results ?? []).compactMap { o -> (CGRect, String)? in
  guard let t = o.topCandidates(1).first?.string else { return nil }; return (o.boundingBox, t) }
let rows = obs.sorted { $0.0.midY > $1.0.midY }
var lines: [[(CGRect, String)]] = []
for r in rows {
  if let i = lines.firstIndex(where: { abs($0[0].0.midY - r.0.midY) < r.0.height * 0.5 }) { lines[i].append(r) }
  else { lines.append([r]) }
}
for l in lines { print(l.sorted { $0.0.minX < $1.0.minX }.map { $0.1 }.joined(separator: " | ")) }
