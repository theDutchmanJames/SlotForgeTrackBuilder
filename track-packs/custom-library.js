// The gallery shares the editor's local pack library on the same browser origin.
(()=>{'use strict';
 const host=document.getElementById('saved-custom-packs');
 function render(){host.replaceChildren();try{
  const saved=localStorage.getItem('slotforge.custom-library.v2'),legacy=localStorage.getItem('slotforge.custom.v1');
  const raw=saved!==null?JSON.parse(saved):null;
  if(raw&&(raw.format!=='slotforge.custom-library'||raw.version!==2||!Array.isArray(raw.packs)))throw Error('Invalid library');
  const packs=raw?raw.packs:legacy?[{id:'custom',name:'Custom / unbranded',inLibrary:true,pieces:JSON.parse(legacy)}]:[];
  let count=0;for(const p of packs){if(!p||p.inLibrary!==true||typeof p.name!=='string'||!Array.isArray(p.pieces)||typeof p.id!=='string'||!(p.id==='custom'||/^custom-pack-[-\w]{1,100}$/.test(p.id)))continue;count++;
   const card=document.createElement('article');card.className='card';const title=document.createElement('h3');title.textContent=p.name;const countText=document.createElement('p');countText.className='badge';countText.textContent=p.pieces.length+' track pieces · saved custom pack';const summary=document.createElement('p');summary.textContent='A complete pack containing your own piece definitions.';const link=document.createElement('a');link.className='link';link.href='../app/index.html?pack='+encodeURIComponent(p.id)+'#custom';link.textContent='Open this pack';card.append(title,countText,summary,link);host.append(card);
  }if(!count){const p=document.createElement('p');p.textContent='Create a named custom pack, add its pieces, then choose Save to Track Pack Library.';host.append(p);}
 }catch{const p=document.createElement('p');p.textContent='The custom pack library could not be read. Open Custom Track to recover or import your packs.';host.append(p);}}
 render();window.addEventListener('storage',render);window.addEventListener('pageshow',render);
})();
