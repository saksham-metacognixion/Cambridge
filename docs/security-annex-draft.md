# Annex: Security, Backup and Data-Protection Obligations (DRAFT)

Draft for the website hosting and maintenance (AMC) contract between Cambridge Medical & Rehabilitation Center ("the Client")
and Metacognixion ("the Vendor") for cambridgehospital.com. Prepared 2 November 2026 in answer to the Client's request that
cybersecurity, vulnerability management, incident response, backup and data protection be covered contractually and backed by
evidence. Values in **[square brackets]** are proposals to be agreed commercially; everything else describes what is already
built and is evidenced in `docs/security-controls.md` (section references below point there).

## 1. Scope of the service

1.1 The Vendor hosts, maintains and updates the public website cambridgehospital.com (all regional and language editions),
its contact / appointment / referral / feedback / newsletter forms, and the editorial dashboard used by the Client's staff to
publish Blog and PR articles.

1.2 The website is a static site served from a Microsoft Azure virtual machine behind Cloudflare. It has no database, no
content-management plugins and no patient portal. (Controls doc §1.)

1.3 Out of scope: the Client's Cloudflare, Azure, Google and email accounts (the Client retains ownership and administrative
control of all of them and grants the Vendor the access needed for the service), any other systems of the Client, and any
feature not listed in 1.1.

## 2. Data protection

2.1 **No storage of personal data.** Form submissions are transmitted by email to the Client's designated mailbox(es) and are
not stored, logged or forwarded to any third-party service by the Vendor. The Vendor keeps no database of submissions.
(Controls doc §2.)

2.2 The Vendor does not install analytics, tracking or advertising scripts without the Client's written instruction. Where the
Client instructs such a tool, a cookie-consent mechanism is provided with it.

2.3 Visitor region detection uses the country code supplied by Cloudflare and a first-party cookie; no IP addresses are
stored by the Vendor.

2.4 Secrets (email credentials, anti-spam keys, dashboard credentials) are held only on the server in root-restricted
environment files and in GitHub's encrypted secrets store. They never appear in source code.

2.5 The Vendor processes personal data only as needed to deliver the service and in accordance with UAE Federal Decree-Law
No. 45 of 2021 (PDPL) and, where applicable, the Saudi PDPL. Any sub-processor (currently: Microsoft Azure UAE North, Cloudflare,
GitHub, the transactional email provider named in the operations runbook) is listed in the operations runbook and changes are
notified to the Client in advance.

## 3. Security controls maintained by the Vendor

The Vendor maintains, and keeps in force for the term of the contract, at least the following (Controls doc §3 to §5):

| Area | Obligation |
|---|---|
| Transport | HTTPS on every page; TLS between Cloudflare and the origin in "Full (strict)" mode; HTTP redirected to HTTPS; HSTS. |
| Browser hardening | Security response headers on every page: Content-Security-Policy (scripts only from the site and the named third parties: Cloudflare Turnstile, Google Maps, YouTube / Vimeo players), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. |
| Forms | Server-side validation, size limits, attachment type checks, same-origin check and Cloudflare Turnstile anti-bot protection on every form. |
| Server | Ubuntu LTS with automatic security updates; SSH key-only access; the site and dashboard run as unprivileged users under systemd hardening; no password logins. |
| Dashboard | Named accounts only; passwords stored as salted hashes; signed, HttpOnly, Secure, SameSite=Strict session cookies with a 12-hour expiry; login rate limiting; CSRF protection; every saved article validated and sanitised before it reaches the site; uploaded images re-encoded. |
| Deployment | Code reaches production only through the Client-visible GitHub repository and its automated pipeline (tests must pass; server identity pinned); every release kept for rollback. |
| Change control | No production change without the Client's approval of the work item; emergency security fixes may be deployed first and reported within [1 business day]. |

## 4. Vulnerability management

4.1 Dependency and platform review: the Vendor reviews third-party package advisories (`npm audit` and lockfile review) and
operating-system patches at least **[monthly]** and applies security fixes within **[7 days]** of a fix being available for
High / Critical issues and **[30 days]** for others.

4.2 Configuration review: Cloudflare WAF, bot and TLS settings reviewed with the Client **[quarterly]**.

4.3 External scan: an external vulnerability scan of the public domain (e.g. OWASP ZAP baseline, SSL Labs, securityheaders.com)
**[annually]** and after any major change, with the report shared with the Client.

4.4 The Client may commission its own penetration test with **[10 business days']** notice; the Vendor cooperates and remediates
confirmed findings on the timelines in 4.1.

## 5. Incident response

5.1 Definition: a security incident is any confirmed or reasonably suspected unauthorised access to, alteration of, or
disruption of the website, the dashboard, the server, the deployment pipeline or the form email flow.

5.2 Notification: the Vendor notifies the Client's named contact by **[phone and email]** within **[4 hours]** of becoming
aware of an incident affecting availability or integrity, and within **[24 hours]** with a written preliminary assessment.
Because no personal data is stored on the server, a server compromise does not by itself constitute a personal-data breach;
where form email credentials are affected, this is stated explicitly in the notification.

5.3 Response: the Vendor can within **[1 hour]** of confirmation roll back to any of the five previous releases, rotate the
dashboard and email credentials, block traffic at Cloudflare or take the origin server off the public internet while the
site remains served from Cloudflare's cache. (Controls doc §8.)

5.4 Post-incident: a written report within **[5 business days]** of closure covering cause, impact, timeline, remediation and
preventive measures.

5.5 Severity and response targets (proposal):

| Severity | Example | Response | Restore / workaround |
|---|---|---|---|
| P1 | Site down, defacement, credential compromise | [1 h, 24×7] | [4 h] |
| P2 | Forms not delivering, dashboard unavailable | [4 business hours] | [1 business day] |
| P3 | Non-critical defect, cosmetic issue | [1 business day] | [5 business days] |

## 6. Backup and recovery

6.1 Source code and configuration: held in the private GitHub repository (the Client is granted read access); the whole site
can be rebuilt from it on a new server. (Controls doc §6.)

6.2 Editorial content (articles, authors, images, version history): archived on the server nightly, **[30]** daily copies
kept, and copied to Azure Blob Storage in the Client's subscription once configured. Content also flows back into the
repository on every deployment.

6.3 Server: the Client enables an Azure VM backup / snapshot policy on the virtual machine (recommended daily, **[14-day]**
retention). The Vendor documents the restore procedure.

6.4 Recovery objectives (proposal): RPO **[24 hours]** for editorial content, zero for code; RTO **[4 hours]** for a full
rebuild on a new server. Restore tested **[annually]** with the Client.

## 7. Access control

7.1 Production access is limited to named Vendor staff listed in the operations runbook; SSH keys are personal and revoked on
departure within **[1 business day]**. The Client is informed of the list and of changes.

7.2 Dashboard accounts are created and removed on the Client's written instruction. Credentials are never shared by email;
the Client's staff set their own passwords.

7.3 All Vendor access to the Client's Cloudflare, Azure and Google accounts uses the Client's invitation / IAM roles with the
least privilege needed; the Client can revoke it at any time.

## 8. Evidence and reporting

8.1 On request and at least **[quarterly]**, the Vendor provides: the current `security-controls.md`, the latest external scan
results, the GitHub Actions deployment log, a backup listing, and the list of staff with production access.

8.2 The Client may verify the controls at any time via securityheaders.com, SSL Labs, its own Cloudflare dashboard and
read access to the repository.

## 9. Exit

9.1 On termination the Vendor hands over the repository, the content archive, the server configuration and all credentials
within **[10 business days]**, then deletes its own copies of credentials and confirms in writing. The site and its content
are the Client's property throughout.

---

*Items still to be put in place on production before this annex is signed as "implemented": installation of the dashboard
and nightly backup on the Azure VM (needs VM access), the Cloudflare changes listed in the controls document, and the
Client's Azure backup policy (6.3).*
