# Figma MCP call log (this file/target only; earlier failed calls on the ORIGINAL file FKigNZ... are not listed)
1. get_design_context 93:894 -> SPARSE outline only (no styles, no assets, no screenshot). See root-outline.md
2. get_variable_defs 93:894 -> {} (file defines NO variables; take values from each section's design context)
3. get_design_context 112:13214 Header (excludeScreenshot) -> header-spec.md, assets/header/*.svg (39 SVGs downloaded)
4. get_design_context 21:1425 Hero (excludeScreenshot) -> hero-spec.md, assets/hero/*.png
5. get_design_context 21:1617 CTA Tab (excludeScreenshot) -> cta-spec.md, assets/cta/*.svg
6. get_design_context 21:1204 Doctors (excludeScreenshot) -> doctors-spec.md, assets/doctors/*
7. get_design_context 67:3725 Facilities & Presence (excludeScreenshot) -> facilities-spec.md, assets/facilities/*
8. get_design_context 67:4295 Health calculators (excludeScreenshot) -> calculators-spec.md, assets/calculators/care.png
9. get_design_context 112:9555 Footer (excludeScreenshot) -> footer-spec.md, assets/footer/*
10. use_figma (wrap sections, move pills, export pins) -> OK. First run mis-positioned the 6 pills (Doctors is a GROUP => child coords are root-relative); 
11. use_figma repair -> pills restored, spot checks 0 offset. (use_figma may or may not count against the MCP limit -- unconfirmed)
12. get_design_context 2007:340 Services (excludeScreenshot) -> services-spec.md, assets/services/*
13. get_design_context 2007:341 Complete Care Support (excludeScreenshot) -> care-support-spec.md, assets/care-support/*
14. get_design_context 2007:342 Testimonials (excludeScreenshot) -> testimonials-spec.md, assets/testimonials/*
15. get_design_context 2007:343 Start Your Recovery (excludeScreenshot) -> recovery-spec.md, assets/recovery/banner.svg
16. get_design_context 2007:344 News & Insights (excludeScreenshot) -> news-spec.md, assets/news/*
17. get_design_context 2007:345 Insurance (excludeScreenshot) -> insurance-spec.md, assets/insurance/*
18. get_design_context 2007:346 Contact (excludeScreenshot) -> contact-spec.md, assets/contact/*
19. use_figma read-only (pill styles) -> doctors-spec.md
20. use_figma read-only (page bg/root fill/dots) -> page-spec.md, assets/dots/*
SUMMARY: get_design_context/get_variable_defs fetches = 16 (root, vars, header, hero, cta, doctors, facilities, calculators, footer, services, care-support, testimonials, recovery, news, insurance, contact). use_figma = 4 (wrap, repair, 2 reads). Failed calls on the ORIGINAL file (before): ~6.
21. get_design_context 86:431 Contact us PAGE (drafts copy, WITH screenshot per figma-design-to-code skill) -> contact-page-spec.md, assets/contact-page/* (15 files). Header + Footer inside it are the same as the landing ones: not re-downloaded.
SUMMARY after call 21: get_design_context/get_variable_defs = 17, use_figma = 4 (total 21 logged).
22. get_design_context 62:179 Find a Doctor (with screenshot) -> FAILED: Starter plan MCP limit reached. No data.
23. get_design_context 32:826 Doctor - Page (with screenshot) -> FAILED: same limit error. No data.
SUMMARY after 23: successful calls = 21 (17 get_design_context/get_variable_defs + 4 use_figma). 2 failed on 2 Oct 2026 with the plan-limit error: monthly limit is exhausted. Do not retry until the plan is upgraded or the limit resets.
24. get_design_context 62:179 (after re-auth as paid account) -> FAILED: "no edit access to this file" (access error, not the plan limit). No data.
25. get_design_context 32:826 -> FAILED: same access error. Fix: share the file with the paid account (or move it into the paid team). Do not retry until then.
NEW FILE KEY (paid account duplicate): LJIRtzU574JrA1BgK881Qm (node IDs preserved). Old key vCNWiFsepoBswUbksI4Tbi no longer used for new calls.
26. get_design_context 62:179 Find a Doctor (new file, with screenshot) -> SPARSE outline only (screenshot not returned) -> find-a-doctor-spec.md. Children must be fetched separately.
27. get_design_context 32:826 Doctor - Page (new file, with screenshot) -> FULL code + screenshot -> doctor-profile-spec.md, doctor-profile.png, assets/doctor-profile/* (6 files)
SUMMARY after 27: successful get_design_context/get_variable_defs = 19, use_figma = 4. Failed: 4 (2 plan-limit, 2 access) + earlier ~6 on the original file.
28. get_design_context 62:180 Hero (find-a-doctor) -> assets/find-a-doctor/hero-banner.png
29. get_design_context 62:186 Search-by-name box -> chevron.svg (Specialities box 62:190 is identical, same size)
30. get_design_context 62:1002 Care panel -> care-mask/care-bars/icon-*.svg
31. get_screenshot 62:179 -> figma-cache/find-a-doctor.png (992x2400)
SUMMARY after 31: successful get_design_context/get_variable_defs = 22, get_screenshot = 1, use_figma = 4.
32. get_design_context 62:310 Card (Ahmad, with Book Now) -> assets/find-a-doctor/card-mask-ahmad.svg, card-fill-ahmad.svg
33. get_design_context 62:223 Card (Rober, last in row) -> card-mask-rober.svg, card-fill-rober.svg, dr-rober-figma.png
SUMMARY after 33: get_design_context/get_variable_defs = 24, get_screenshot = 1, use_figma = 4.
22. get_design_context 100:5522 Media Hub (file vCNWiFsepoBswUbksI4Tbi) -> FAILED: "you don't have edit access to this file" (debug 1d3c7ef4-671b-4210-a931-ba536ce662d2). Not retried.
23. get_design_context 170:839 Health Article Layout -> FAILED, same error (debug eebf7c61-2b43-4245-a814-05249ffa3285). Not retried.
SUMMARY after call 23: successful = 21 (17 context/vars + 4 use_figma); 2 failed (access error, not a rate limit).
24. get_design_context 100:5522 Media Hub (NEW file key LJIRtzU574JrA1BgK881Qm; previous key vCNWi... gave access error calls 22-23 above, failed) WITH screenshot -> media-hub-spec.md, assets/media-hub/* (17 files)
25. get_design_context 170:839 Health Article Layout WITH screenshot -> article-layout-spec.md, assets/article/* (19 files)
SUMMARY after call 25: successful get_design_context/vars = 19, use_figma = 4, failed = 2 (access). Account limit unknown (~20/month) -- do not make further calls without OK.
