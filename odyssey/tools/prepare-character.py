"""Build a posed, anatomically based binary character on the remote runner only.
Original pipeline; consumes pinned CC0 graphical data, not MakeHuman program code.
No mesh material is exported as visible output. Triangles are depth-only occluders.
"""
import base64, hashlib, json, math, os, pathlib, urllib.request
import numpy as np

ROOT=pathlib.Path(__file__).resolve().parents[1]
MANIFEST=json.loads((ROOT/'assets/makehuman-manifest.json').read_text())
CACHE=ROOT/'.build/source-assets'
CACHE.mkdir(parents=True,exist_ok=True)
provenance=[]
def asset(path):
    spec=next(f for f in MANIFEST['files'] if f['path']==path)
    dest=CACHE/path
    if not dest.exists():
        url='https://raw.githubusercontent.com/'+MANIFEST['repository']+'/'+MANIFEST['commit']+'/'+path
        data=urllib.request.urlopen(url,timeout=60).read()
        dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    data=dest.read_bytes()
    gitsha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
    assert gitsha==spec['gitBlob'],('Asset changed',path,gitsha)
    provenance.append({**spec,'sha256':hashlib.sha256(data).hexdigest()})
    return data.decode('utf8')
V=[];groups={};group=''
for line in asset('makehuman/data/3dobjs/base.obj').splitlines():
    if line.startswith('v '):V.append(list(map(float,line.split()[1:4])))
    elif line.startswith('g '):group=line[2:];groups.setdefault(group,[])
    elif line.startswith('f '):groups[group].append([int(p.split('/')[0])-1 for p in line.split()[1:]])
V=np.asarray(V,dtype=float)
for path,amount in [('makehuman/data/targets/macrodetails/african-male-young.target',1.0),('makehuman/data/targets/head/head-square.target',.05),('makehuman/data/targets/eyes/l-eye-height1-incr.target',.55),('makehuman/data/targets/eyes/r-eye-height1-incr.target',.55)]:
    for line in asset(path).splitlines():
        if not line or line[0]=='#':continue
        a=line.split()
        if len(a)==4:V[int(a[0])]+=amount*np.asarray(list(map(float,a[1:])))
rig=json.loads(asset('makehuman/data/rigs/default.mhskel'))
weights=json.loads(asset('makehuman/data/rigs/default_weights.mhw'))['weights']
license_text=asset('LICENSE.ASSETS.md');asset('LICENSE.md')
scale=.15
V*=scale
J={name:V[ids].mean(axis=0) for name,ids in rig['joints'].items()}
bones=rig['bones'];B={n:J[b['head']] for n,b in bones.items()}
origin=J[bones['spine05']['head']]
def unit(v):
    return v/max(1e-12,np.linalg.norm(v))
def rx(a):
    c,s=np.cos(a),np.sin(a);return np.array([[1,0,0],[0,c,-s],[0,s,c]])
def align(a,b):
    a,b=unit(a),unit(b);v=np.cross(a,b);c=np.dot(a,b);s=np.linalg.norm(v)
    if s<1e-9:return np.eye(3) if c>0 else np.diag([-1,-1,1])
    K=np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]])
    return np.eye(3)+K+K@K*((1-c)/(s*s))
def ik(a,c,l1,l2,pole):
    delta=c-a;d=np.linalg.norm(delta)
    assert d<l1+l2 and d>abs(l1-l2),(d,l1,l2)
    u=delta/d;x=(l1*l1-l2*l2+d*d)/(2*d)
    v=unit(pole-a-u*np.dot(pole-a,u))
    return a+u*x+v*math.sqrt(max(0,l1*l1-x*x))
overrides={n:rx(a) for n,a in [('root',0),('spine05',.02),('spine04',.035),('spine03',.045),('spine02',.055),('spine01',.07),('neck01',.085),('neck02',.105),('neck03',.125),('head',.14)]}
cache={}
def transform(n):
    if n in cache:return cache[n]
    parent=bones[n]['parent']
    if parent:
        R0,H0=transform(parent);H=R0@(B[n]-B[parent])+H0
    else:R0=np.eye(3);H=B[n]-origin+np.array([0,1.08,-.045])
    R=overrides.get(n,R0)
    cache[n]=(R,H);return R,H
def point(n,p):
    R,H=transform(n);return R@(p-B[n])+H
pose={}
for side,s in [('L',1),('R',-1)]:
    shoulder=point('upperarm01.'+side,B['upperarm01.'+side])
    elbow0=B['lowerarm01.'+side];wrist0=B['wrist.'+side];shoulder0=B['upperarm01.'+side]
    wrist=np.array([s*.225,1.371,.525])
    elbow=ik(shoulder,wrist,np.linalg.norm(elbow0-shoulder0),np.linalg.norm(wrist0-elbow0),np.array([s*.50,1.08,.16]))
    upper=align(elbow0-shoulder0,elbow-shoulder);lower=align(wrist0-elbow0,wrist-elbow)
    for n in ['upperarm01','upperarm02']:overrides[n+'.'+side]=upper
    for n in ['lowerarm01','lowerarm02']:overrides[n+'.'+side]=lower
    across=unit(B['finger2-1.'+side]-B['finger5-1.'+side])
    forward=unit(B['finger3-1.'+side]-wrist0)
    across=unit(across-forward*np.dot(across,forward));normal=unit(np.cross(across,forward))
    targetAcross=np.array([-s,0,0]);targetForward=np.array([0,-.035,1]);targetForward=unit(targetForward)
    hand=np.column_stack([targetAcross,targetForward,np.cross(targetAcross,targetForward)])@np.column_stack([across,forward,normal]).T
    overrides['wrist.'+side]=hand
    for finger in range(2,6):
        for segment,angle in [(1,.015),(2,.085),(3,.145)]:
            overrides[f'finger{finger}-{segment}.{side}']=rx(angle)@hand
    cache.clear()
    hip0=B['upperleg01.'+side];knee0=B['lowerleg01.'+side];ankle0=B['foot.'+side]
    hip=point('upperleg01.'+side,hip0);ankle=np.array([s*.255,.163,.515])
    knee=ik(hip,ankle,np.linalg.norm(knee0-hip0),np.linalg.norm(ankle0-knee0),np.array([s*.25,.85,1.4]))
    upper=align(knee0-hip0,knee-hip);lower=align(ankle0-knee0,ankle-knee)
    for n in ['upperleg01','upperleg02']:overrides[n+'.'+side]=upper
    for n in ['lowerleg01','lowerleg02']:overrides[n+'.'+side]=lower
    overrides['foot.'+side]=np.eye(3)
    cache.clear()
    pose[side]={'shoulder':shoulder.tolist(),'elbow':elbow.tolist(),'wrist':wrist.tolist(),'hip':hip.tolist(),'knee':knee.tolist(),'ankle':ankle.tolist()}
for n in bones:transform(n)
normWeight=np.zeros(len(V));handWeight=np.zeros(len(V));footWeight=np.zeros(len(V))
for name,entries in weights.items():
    for i,w in entries:
        normWeight[i]+=w
        if name.startswith(('wrist','metacarpal','finger')):handWeight[i]+=w
        if name.startswith(('foot','toe')):footWeight[i]+=w
def skin(v):
    out=np.zeros_like(v)
    for n,entries in weights.items():
        if n not in bones or not entries:continue
        ids=np.asarray([a[0] for a in entries]);w=np.asarray([a[1] for a in entries])
        R,H=transform(n)
        out[ids]+=( (v[ids]-B[n])@R.T+H )*w[:,None]
    good=normWeight>1e-7
    out[good]/=normWeight[good,None]
    out[~good]=v[~good]-origin+np.array([0,1.08,-.045])
    return out
def triangles(faces):
    return np.asarray([[f[0],f[k],f[k+1]] for f in faces for k in range(1,len(f)-1)],dtype=int)
def normals(p,faces):
    tri=triangles(faces);n=np.zeros_like(p)
    faceN=np.cross(p[tri[:,1]]-p[tri[:,0]],p[tri[:,2]]-p[tri[:,0]])
    for k in range(3):np.add.at(n,tri[:,k],faceN)
    n/=np.maximum(1e-12,np.linalg.norm(n,axis=1))[:,None]
    return n
# Loose clothing follows the anatomical mesh and its skeletal weights, not primitive cylinders.
cloth=V.copy();helper=groups['helper-tights'];N=normals(V,helper)
neighbors={}
for f in helper:
    for i,j in zip(f,f[1:]+f[:1]):
        neighbors.setdefault(i,set()).add(j);neighbors.setdefault(j,set()).add(i)
for _ in range(3):
    new=cloth.copy()
    for i,ns in neighbors.items():new[i]=cloth[i]*.5+cloth[list(ns)].mean(axis=0)*.5
    cloth=new
for i in neighbors:
    shirt=V[i,1]>.30
    inflation=.047 if shirt else .024
    cloth[i]+=N[i]*inflation
    cloth[i]+=N[i]*(.0035*math.sin(V[i,1]*47+V[i,0]*29)*math.sin(V[i,0]*17))
P=skin(V);C=skin(cloth)
skinFaces=[];clothFaces=[]
for f in groups['body']:
    if V[f,1].mean()>1.05 or handWeight[f].mean()>.38:skinFaces.append(f)
for f in helper:
    if V[f,1].mean()<1.085 and handWeight[f].mean()<.58 and footWeight[f].mean()<.70:clothFaces.append(f)
# Catmull–Clark subdivision supplies curved anatomy; only glyph samples get visible colour.
def subdivide(p,rest,faces):
    used=sorted({i for f in faces for i in f});mapping={v:i for i,v in enumerate(used)}
    data=np.concatenate([p[used],rest[used]],axis=1);fs=[[mapping[i] for i in f] for f in faces]
    edgeFaces={};vertexFaces=[[] for _ in used];vertexEdges=[set() for _ in used]
    fp=np.array([data[f].mean(axis=0) for f in fs])
    for fi,f in enumerate(fs):
        for i in f:vertexFaces[i].append(fi)
        for a,b in zip(f,f[1:]+f[:1]):
            edge=tuple(sorted((a,b)));edgeFaces.setdefault(edge,[]).append(fi)
            vertexEdges[a].add(b);vertexEdges[b].add(a)
    points=[]
    for i,p0 in enumerate(data):
        boundary=[j for j in vertexEdges[i] if len(edgeFaces[tuple(sorted((i,j)))])==1]
        if len(boundary)==2:q=.75*p0+.125*(data[boundary[0]]+data[boundary[1]])
        else:
            ns=list(vertexEdges[i]);n=len(ns);F=fp[vertexFaces[i]].mean(axis=0);E=((data[ns]+p0)*.5).mean(axis=0)
            q=(F+2*E+(n-3)*p0)/n
        points.append(q)
    ep={}
    for edge,adj in edgeFaces.items():
        a,b=edge;ep[edge]=len(points)
        points.append((data[a]+data[b]+fp[adj].sum(axis=0))/(2+len(adj)))
    fpIndex=len(points);points.extend(fp)
    out=[]
    for fi,f in enumerate(fs):
        for k,a in enumerate(f):out.append([a,ep[tuple(sorted((a,f[(k+1)%len(f)])))],fpIndex+fi,ep[tuple(sorted((f[k-1],a)))]])
    arr=np.array(points);return arr[:,:3],arr[:,3:],out
SP,SR,SF=subdivide(P,V,skinFaces)
CP,CR,CF=subdivide(C,V,clothFaces)
headFaces=[f for f in SF if SR[f,1].mean()>1.10]
neckHands=[f for f in SF if SR[f,1].mean()<=1.10]
random=np.random.default_rng(8741)
def sample(p,rest,faces,count,distance,weight):
    tri=triangles(faces);N=normals(p,faces)
    a,b,c=p[tri[:,0]],p[tri[:,1]],p[tri[:,2]]
    areas=np.linalg.norm(np.cross(b-a,c-a),axis=1);cdf=np.cumsum(areas);cdf/=cdf[-1]
    ids=np.searchsorted(cdf,random.random(count*5))
    u=np.sqrt(random.random(len(ids)));v=random.random(len(ids));bary=np.column_stack([1-u,u*(1-v),u*v])
    locations=(p[tri[ids]]*bary[:,:,None]).sum(axis=1)
    normals0=(N[tri[ids]]*bary[:,:,None]).sum(axis=1)
    rests=(rest[tri[ids]]*bary[:,:,None]).sum(axis=1)
    grid={};out=[];restOut=[]
    for pos,n,r in zip(locations,normals0,rests):
        key=tuple(np.floor(pos/distance).astype(int));near=[]
        for dx in (-1,0,1):
            for dy in (-1,0,1):
                for dz in (-1,0,1):near.extend(grid.get((key[0]+dx,key[1]+dy,key[2]+dz),[]))
        if any(np.dot(pos-q,pos-q)<distance*distance for q in near):continue
        grid.setdefault(key,[]).append(pos)
        out.append([*pos,*unit(n),weight(r,pos,n)]);restOut.append(r)
        if len(out)>=count:break
    return np.array(out),np.array(restOut)
# Revision 4: anatomical microtypography. Regular surface rows replace the random
# head point cloud. Rays intersect the actual subdivided 3D skin/eye anatomy;
# only the resulting oriented glyph centres and normals are exported as colour.
HP=SP.copy();HR=SR.copy();HF=list(headFaces);HK=[0]*len(HF)
eyeRest={};eyeGaze={}
# Use the actual CC0 high-resolution corneal/ocular asset, not the low-resolution
# rig helper sphere. Its declarative mapping fits it to this morphed anatomy.
ocular_obj=asset('makehuman/data/eyes/high-poly/high-poly.obj')
ocular_map=asset('makehuman/data/eyes/high-poly/high-poly.mhclo')
ocular_faces=[];ocular_original=[]
for line in ocular_obj.splitlines():
    if line.startswith('v '):ocular_original.append(list(map(float,line.split()[1:4])))
    elif line.startswith('f '):ocular_faces.append([int(x.split('/')[0])-1 for x in line.split()[1:]])
offsetScale=np.ones(3)*scale;mapping=[];reading=False
for line in ocular_map.splitlines():
    a=line.split()
    if not a or a[0].startswith('#'):continue
    if a[0] in ('x_scale','y_scale','z_scale'):
        axis={'x_scale':0,'y_scale':1,'z_scale':2}[a[0]]
        offsetScale[axis]=abs(V[int(a[1]),axis]-V[int(a[2]),axis])/float(a[3])
    elif a[0]=='verts':reading=True
    elif reading and len(a)==9:mapping.append(a)
assert len(mapping)==len(ocular_original)
ocular_rest=[]
for a in mapping:
    ids=np.array(list(map(int,a[:3])));w=np.array(list(map(float,a[3:6])));offset=np.array(list(map(float,a[6:])))
    ocular_rest.append(w@V[ids]+offset*offsetScale)
ocular_rest=np.asarray(ocular_rest)
ocular_pos=np.array([point('head',p) for p in ocular_rest])
start=len(HP);HP=np.concatenate([HP,ocular_pos]);HR=np.concatenate([HR,ocular_rest])
for face in ocular_faces:
    HF.append([i+start for i in face]);HK.append(1 if ocular_rest[face,0].mean()>0 else 2)
for side,kind in [('L',1),('R',2)]:
    eyeRest[kind]=J[bones['eye.'+side]['head']]
    eyeGaze[kind]=unit(J[bones['eye.'+side]['tail']]-eyeRest[kind])
def scalp_line(r):
    front=np.clip((r[2]/scale-.15)/1.25,0,1)
    return 8.68+.76*front
def skinTone(r,kind=0):
    x,y,z=r/scale
    if kind:
        facing=np.dot(unit(r-eyeRest[kind]),eyeGaze[kind])
        return .025 if facing>.982 else .31 if facing>.90 else .98
    w=.84
    for centre in eyeRest.values():
        # Eyebrows are a narrow anatomical band, not giant painted eye sockets.
        if abs(r[0]-centre[0])<.052 and abs(r[1]-(centre[1]+.034))<.006 and r[2]>centre[2]-.008:w=.23
    if 8.04<y<8.30 and abs(x)<.41 and z>1.25:w=.68
    if y>scalp_line(r):w=.27
    return w
def typographic_head(features=False):
    tri=triangles(HF);kinds=np.asarray([kind for face,kind in zip(HF,HK) for _ in range(len(face)-2)])
    assert len(kinds)==len(tri)
    restTri=HR[tri];worldN=normals(HP,HF)
    out=[];outRest=[];outKind=[]
    low=restTri[:,:,1].min();high=restTri[:,:,1].max()
    # Vertical pitch and angular kerning are deliberately different, matching
    # the 0.64:1 monospace glyph proportions instead of overlapping point sprites.
    if features:
        low=min(c[1] for c in eyeRest.values())-.042;high=max(c[1] for c in eyeRest.values())+.042
    for row,y in enumerate(np.arange(low+.002,high-.001,.0017 if features else .0060)):
        eligible=np.where((restTri[:,:,1].min(axis=1)<=y)&(restTri[:,:,1].max(axis=1)>=y))[0]
        if not len(eligible):continue
        ts=restTri[eligible];radius=max(.035,float(np.quantile(np.hypot(ts[:,:,0],ts[:,:,2]-.04),.85)))
        count=max(32,int(2*math.pi*radius/(.00145 if features else .0038)))
        theta=(np.arange(count)+.5*(row%2))/count*2*math.pi
        if features:theta=theta[(theta<.70)|(theta>2*math.pi-.70)];count=len(theta)
        directions=np.column_stack([-np.sin(theta),np.zeros(count),-np.cos(theta)])
        origins=np.column_stack([.55*np.sin(theta),np.full(count,y),.04+.55*np.cos(theta)])
        e1=ts[:,1]-ts[:,0];e2=ts[:,2]-ts[:,0]
        h=np.cross(directions[:,None,:],e2[None,:,:])
        det=np.einsum('tj,rtj->rt',e1,h)
        inv=np.divide(1.,det,out=np.zeros_like(det),where=np.abs(det)>1e-10)
        delta=origins[:,None,:]-ts[None,:,0,:]
        u=np.einsum('rtj,rtj->rt',delta,h)*inv
        q=np.cross(delta,e1[None,:,:])
        v=np.einsum('rj,rtj->rt',directions,q)*inv
        distance=np.einsum('tj,rtj->rt',e2,q)*inv
        valid=(np.abs(det)>1e-10)&(u>=0)&(v>=0)&(u+v<=1)&(distance>0)&(distance<1.1)
        distance=np.where(valid,distance,np.inf);nearest=distance.argmin(axis=1)
        for ri,ti in enumerate(nearest):
            if not np.isfinite(distance[ri,ti]):continue
            ids=tri[eligible[ti]];bary=np.array([1-u[ri,ti]-v[ri,ti],u[ri,ti],v[ri,ti]])
            p=bary@HP[ids];r=bary@HR[ids];n=unit(bary@worldN[ids]);kind=int(kinds[eligible[ti]])
            if bool(kind)!=features:continue
            # Anatomically occluded samples never replace eyelids or facial skin.
            out.append([*p,*n,skinTone(r,kind)]);outRest.append(r);outKind.append(kind)
    return np.asarray(out),np.asarray(outRest),outKind
head,headRest,headKinds=typographic_head()
eyeGlyphs,eyeGlyphRest,eyeGlyphKinds=typographic_head(True)
assert len(eyeGlyphs)>40,'No visible ocular geometry; refuse a blind portrait'
headFeatureStart=len(head);headFeatureEnd=len(head)+len(eyeGlyphs)
head=np.concatenate([head,eyeGlyphs]);headRest=np.concatenate([headRest,eyeGlyphRest]);headKinds+=eyeGlyphKinds
neck,neckRest=sample(SP,SR,neckHands,6500,.0045,lambda r,p,n:.82)
garment,garmentRest=sample(CP,CR,CF,19000,.0115,lambda r,p,n:.73 if r[1]>.30 else .58)
body=np.concatenate([neck,garment])
# Original short textured coils: a tapered cut with a clear hairline, following
# the actual scalp rather than the old random luminous cap.
coils=[];centres=[]
for row,r,kind in zip(head,headRest,headKinds):
    if kind or r[1]/scale<scalp_line(r):continue
    p,n=row[:3],row[3:6]
    if any(np.linalg.norm(p-q)<.012 for q in centres):continue
    centres.append(p)
    tangent=unit(np.cross(n,[1,0,0] if abs(n[1])>.9 else [0,1,0]));bitangent=np.cross(n,tangent)
    top=max(0,n[1]);length=.005+.026*top;phase=random.random()*2*math.pi
    for j in range(10):
        t=j/9;angle=t*math.pi*3+phase;radius=.0038*(.8+.2*math.sin(t*math.pi))
        q=p+n*(.002+length*math.sin(t*math.pi))+radius*(tangent*math.cos(angle)+bitangent*math.sin(angle))
        coils.append([*q,*unit(n+.2*math.cos(angle)*tangent),.62])

# Six directional depth fields provide geometric ambient visibility around
# eyelids, nose, mouth and ears. No raster image is used in the final product;
# only a per-glyph scalar survives this remote CPU calculation.
def anatomical_visibility(points,normal):
    tri=triangles(HF);weighted=np.zeros(len(points));total=np.zeros(len(points))
    resolution=384
    for direction in [(-.45,.65,1),(.65,.35,1),(0,1,.15),(-1,.15,.25),(1,.15,.25),(0,.3,-1)]:
        light=unit(np.array(direction));u=unit(np.cross(light,[0,1,0]));v=np.cross(u,light)
        projected=HP@np.column_stack([u,v,light]);lo=projected[:,:2].min(axis=0)-.003;hi=projected[:,:2].max(axis=0)+.003
        xy=(projected[:,:2]-lo)/(hi-lo)*(resolution-1);depth=np.full((resolution,resolution),-np.inf)
        for ids in tri:
            pts=xy[ids];z=projected[ids,2]
            x0,y0=np.maximum(0,np.floor(pts.min(axis=0)).astype(int));x1,y1=np.minimum(resolution-1,np.ceil(pts.max(axis=0)).astype(int))
            if x1<x0 or y1<y0:continue
            a,b,c=pts;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if abs(den)<1e-10:continue
            xx,yy=np.meshgrid(np.arange(x0,x1+1),np.arange(y0,y1+1))
            w0=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
            w1=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;w2=1-w0-w1
            inside=(w0>=-.001)&(w1>=-.001)&(w2>=-.001)
            z0=np.where(inside,w0*z[0]+w1*z[1]+w2*z[2],-np.inf)
            depth[y0:y1+1,x0:x1+1]=np.maximum(depth[y0:y1+1,x0:x1+1],z0)
        query=points@np.column_stack([u,v,light]);ij=np.rint((query[:,:2]-lo)/(hi-lo)*(resolution-1)).astype(int);ij=np.clip(ij,0,resolution-1)
        visible=(depth[ij[:,1],ij[:,0]]-query[:,2])<.0018
        cosine=np.maximum(0,normal@light)
        weighted+=visible*cosine;total+=cosine
    return .43+.57*np.divide(weighted,total,out=np.ones_like(total),where=total>1e-8)
visibility=anatomical_visibility(head[:,:3],head[:,3:6])
visibility[headFeatureStart:headFeatureEnd]=np.maximum(.82,visibility[headFeatureStart:headFeatureEnd])
head[:,6]*=visibility

headSurfaceCount=len(head)
head=np.concatenate([head,np.array(coils)])
# Compact, quantized spatial samples, not pre-rendered frames.
def encoded(a,kind):
    return base64.b64encode(np.ascontiguousarray(a,dtype=kind).tobytes()).decode()
def cloud(rows):
    assert np.isfinite(rows).all()
    a=rows.copy();a[:,:3]*=8192;a[:,3:]*=32767
    assert np.max(np.abs(a))<32768
    return {'count':len(a),'samples':encoded(np.rint(a),'<i2')}
def occluder(p,faces):
    ids=sorted({i for f in faces for i in f});remap={old:new for new,old in enumerate(ids)}
    q=p[ids];tri=triangles([[remap[i] for i in f] for f in faces])
    assert len(ids)<65536
    return {'vertices':encoded(np.rint(q*8192),'<i2'),'indices':encoded(tri,'<u2')}
# Anatomical depth-only occluders share the exact sampled skin and eye surfaces.
headProxy=occluder(HP,HF)
bodyProxy=occluder(CP,CF)
brain=point('head',np.array([0,9.35,.35])*scale)
meta={'head':brain.tolist(),'universeScale':.0024,'cutRange':[float(brain[1]-.045),float(brain[1]+.012)],'pose':pose,'source':MANIFEST['commit']}
model={'head':cloud(head),'body':cloud(body),'skinCount':len(neck),'headSurfaceCount':headSurfaceCount,'headFeatureStart':headFeatureStart,'headFeatureEnd':headFeatureEnd,'occlusion':{'head':headProxy,'body':bodyProxy},'meta':meta}
gen=ROOT/'src/generated';gen.mkdir(exist_ok=True)
(gen/'character-data.json').write_text(json.dumps(model,separators=(',',':'))+'\n')
(gen/'character-meta.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
(ROOT/'assets/MAKEHUMAN-CC0.txt').write_text(license_text)
audit={'sourceCommit':os.environ.get('GITHUB_SHA'),'upstream':MANIFEST,'verifiedSources':provenance,'pose':pose,'headCenter':brain.tolist(),'counts':{'head':len(head),'body':len(body),'hairCoils':len(centres),'headSurfaceRows':headSurfaceCount,'ocularGlyphs':len(eyeGlyphs)},'bounds':{'head':[head[:,:3].min(axis=0).tolist(),head[:,:3].max(axis=0).tolist()],'body':[body[:,:3].min(axis=0).tolist(),body[:,:3].max(axis=0).tolist()]},'visibility':{'min':float(visibility.min()),'mean':float(visibility.mean())},'ocularGeometry':{'vertices':len(ocular_rest),'faces':len(ocular_faces),'sampledEyeGlyphs':len(eyeGlyphs)},'pipeline':'Pinned CC0 anatomy, original skeletal pose and garments; ray-intersected, surface-conforming anatomical microtypography replaces stochastic facial point sprites. Remote CPU generation; depth-only meshes never write colour.'}
(ROOT/'diagnostics').mkdir(exist_ok=True)
(ROOT/'diagnostics/r4-character-build.json').write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps({k:v for k,v in audit.items() if k not in ['verifiedSources','upstream']},indent=2))
