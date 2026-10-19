# Map crawled live meta (seo-live.json) onto our URLs -> .astro/seo-pages.json.
# Priority per our URL: 1 live page at the same URL, 2 live page whose exact 301 rule (ours) lands here, 3 /ae and /sa pages
# without a live page: the Global page of the same language (same article / doctor / legal page).
import json,re,collections
live=json.load(open('.astro/seo-live.json'))
ours=set(open('.astro/seo-ours.txt').read().split())
path=lambda u:re.sub(r'^https?://[^/]+','',u) or '/'
slash=lambda p:p if p.endswith('/') else p+'/'
redir={}
for line in open('.astro/qc-seo/dist/_redirects'):
    f=line.split()
    if len(f)>=2 and '*' not in f[0] and not re.search(r'[?#]',f[1]): redir[slash(f[0])]=f[1]
meta={};why=collections.Counter()
for u,v in live.items():
    p=slash(path(u))
    if v.get('status')!=200 or v.get('challenged'): why['not on live']+=1; continue
    fp=slash(path(v['final']))
    # a 301 to a parent (hospital -> hospitals list, refer -> patient hub) is another page's meta
    if fp!=p and (p.startswith(fp) or fp in('/','/ar/','/ae/','/sa/','/ae/ar/','/sa/ar/')): why['live redirects to a parent']+=1; continue
    if v['title'] or v['description']: meta[p]={k:v[k] for k in('title','description') if v[k]}
pages={};src=collections.Counter()
for p in sorted(ours):
    if p in meta: pages[p]=meta[p]; src['same url']+=1; continue
    old=[s for s,t in redir.items() if t==p and s in meta]
    if old: pages[p]=meta[sorted(old)[0]]; src['old url (301)']+=1; continue
m=re.compile(r'^/(ae|sa)(/ar)?/')
for p in sorted(ours):
    if p in pages or not m.match(p): continue
    g=m.sub(lambda x:'/ar/' if x.group(2) else '/',p)
    if g in pages: pages[p]=pages[g]; src['global fallback']+=1
print(dict(why)); print(dict(src)); print('our urls',len(ours),'with live meta',len(pages))
json.dump(pages,open('.astro/seo-pages.json','w'),ensure_ascii=False,indent=1)
open('.astro/seo-missing.txt','w').write('\n'.join(p for p in sorted(ours) if p not in pages))
# Doctors: the live profiles sit behind WordPress short links (docs/doctor.json `link`); title only, no description on live.
# English editions only (no Arabic doctor pages on the live site).
rest={x['slug']:x['link'] for x in json.load(open('docs/doctor.json'))}
n=0
for p in sorted(ours):
    mm=re.match(r'^/(?:(?:ae|sa)/)?patient-hub/find-a-doctor/([^/]+)/$',p)
    if not mm or p in pages: continue
    v=live.get(rest.get(mm.group(1),''))
    if v and v.get('status')==200 and v['title']: pages[p]={'title':v['title']}; n+=1
print('doctor titles',n,'unmatched slugs',[s for s in {re.match(r'.*/find-a-doctor/([^/]+)/$',p).group(1) for p in ours if re.match(r'^/patient-hub/find-a-doctor/[^/]+/$',p)} if s not in rest])
json.dump(pages,open('.astro/seo-pages.json','w'),ensure_ascii=False,indent=1)
open('.astro/seo-missing.txt','w').write('\n'.join(p for p in sorted(ours) if p not in pages))
print('final with live meta',len(pages),'/',len(ours))
