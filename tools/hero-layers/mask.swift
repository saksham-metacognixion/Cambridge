// Apple Vision subject mask for a flat hero banner (see split.py).
//   swiftc -O tools/hero-layers/mask.swift -o /tmp/hero-mask && /tmp/hero-mask <banner.png> <out-dir>
// Writes <out-dir>/mask-all.png (every subject) and <out-dir>/mask-<i>.png per instance, L8, same size as the banner.
import Vision
import CoreImage
import AppKit

let src = CommandLine.arguments[1]
let dir = CommandLine.arguments.count > 2 ? CommandLine.arguments[2] : (src as NSString).deletingLastPathComponent
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: src))
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let obs = req.results?.first else { print("no subject"); exit(1) }
print("instances:", obs.allInstances.map { $0 })
let ctx = CIContext()
func save(_ set: IndexSet, _ name: String) throws {
  let buf = try obs.generateScaledMaskForImage(forInstances: set, from: handler)
  let ci = CIImage(cvPixelBuffer: buf)
  let cs = CGColorSpace(name: CGColorSpace.linearGray)!
  try ctx.writePNGRepresentation(of: ci, to: URL(fileURLWithPath: dir + "/" + name), format: .L8, colorSpace: cs)
}
try save(obs.allInstances, "mask-all.png")
for i in obs.allInstances { try save(IndexSet(integer: i), "mask-\(i).png") }
print("done")
