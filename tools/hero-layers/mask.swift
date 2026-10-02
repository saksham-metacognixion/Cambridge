import Vision
import CoreImage
import AppKit

let dir = CommandLine.arguments[1]
let url = URL(fileURLWithPath: dir + "/banner3.png")
let handler = VNImageRequestHandler(url: url)
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
