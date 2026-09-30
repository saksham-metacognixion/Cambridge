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
