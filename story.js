'use strict';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),id=params.get('id'),dev=params.get('project')==='dev';
const project=dev?'woywdpdwnnjhwcmhrdvb':'zthffofkkbdlkhpdicpm',apiRoot=`https://${project}.supabase.co/functions/v1/community`;
let story=null,position=0,timer=null,playing=false,seconds=3,slideReady=false,swipeStart=null;
const photoURL=id=>`${apiRoot}/media/${encodeURIComponent(id)}`;
async function api(operation,payload){const response=await fetch(apiRoot,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,payload})});if(!response.ok)throw Error('Connection unavailable');return (await response.json()).data;}
function text(element,value){element.textContent=value??'';}
function stop(){clearTimeout(timer);timer=null;playing=false;text($('pause'),'Play');}
function unavailable(message='This story is no longer available.'){stop();if($('presentation').open)$('presentation').close();$('story').hidden=true;$('status').hidden=false;$('status').replaceChildren();const title=document.createElement('h1'),copy=document.createElement('p');title.textContent=message;copy.textContent='The author may have made it private or removed it.';$('status').append(title,copy);}
function schedule(){
 clearTimeout(timer);timer=null;if(!playing||!slideReady)return;
 timer=setTimeout(()=>{if(position<story.photos.length-1){position++;showSlide();}else stop();},seconds*1000);
}
function showSlide(){
 clearTimeout(timer);slideReady=false;const photo=story.photos[position];
 $('slide').onload=()=>{slideReady=true;schedule();};
 $('slide').src=photoURL(photo.media.id);$('slide').alt=photo.caption||`Park Story photo ${position+1}`;text($('caption'),photo.caption);text($('position'),`${position+1} / ${story.photos.length}`);$('prev').disabled=position===0;$('next').disabled=position===story.photos.length-1;
 text($('pause'),playing?'Pause':'Play');
}
function move(direction){stop();const next=Math.max(0,Math.min(story.photos.length-1,position+direction));if(next!==position){position=next;showSlide();}}
async function populate(){
 try{
  if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id??'')){unavailable();return;}
  story=await api('story',{id});if(!story){unavailable();return;}
  $('test-label').hidden=!dev;document.title=`${story.title} · TrekAssistant`;
  text($('title'),story.title);text($('post'),story.post);text($('location'),[story.park,story.city].filter(Boolean).join(' · '));$('cover').src=photoURL(story.photos.find(p=>p.id===story.coverId).media.id);$('status').hidden=true;$('story').hidden=false;$('open-app').href=`trekassistant://community/story/${encodeURIComponent(id)}`;
  const [profile,inspiration]=await Promise.all([api('publicProfile',{id:story.creatorId}),api('inspiration',{id})]);
  text($('creator'),profile?.displayName??'Traveler');text($('avatar'),(profile?.displayName??'Traveler').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase());
  if(profile?.avatar?.id){const img=document.createElement('img');img.alt='';img.src=photoURL(profile.avatar.id);$('avatar').replaceChildren(img);}
  text($('inspired'),`⭐ ${inspiration.count} inspired`);
 }catch{unavailable('This story couldn’t load.');const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=populate;$('status').append(retry);}
}
$('play').onclick=()=>{if(!story?.photos?.length)return;position=0;playing=true;text($('playback-status'),'');$('presentation').showModal();showSlide();};
$('close').onclick=()=>{$('presentation').close();stop();};$('presentation').addEventListener('cancel',stop);$('slide').onerror=()=>{stop();text($('caption'),'Photo could not load. Swipe to try the next photo.');};$('cover').onerror=()=>unavailable();
$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('pause').onclick=()=>{if(playing)stop();else{playing=true;if(position===story.photos.length-1){position=0;showSlide();}else if(!slideReady)showSlide();else{text($('pause'),'Pause');schedule();}}};
$('speed').onchange=()=>{const value=Number($('speed').value);if([3,5,8].includes(value)){seconds=value;schedule();}};
$('slide').addEventListener('pointerdown',event=>{if(event.isPrimary===false)return;swipeStart={x:event.clientX,y:event.clientY,id:event.pointerId};stop();});
$('slide').addEventListener('pointerup',event=>{const start=swipeStart;swipeStart=null;if(!start||start.id!==event.pointerId)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)>=50&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);});
$('slide').addEventListener('pointercancel',()=>{swipeStart=null;});
$('slide').ondragstart=event=>event.preventDefault();
document.addEventListener('keydown',e=>{if(!$('presentation').open)return;if(e.target?.tagName==='SELECT')return;if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='ArrowRight'){e.preventDefault();move(1);}});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
$('share').onclick=async()=>{try{if(navigator.share)await navigator.share({title:story.title,url:location.href});else{await navigator.clipboard.writeText(location.href);text($('share'),'Link copied');}}catch{/* User may cancel the native share sheet. */}};
setInterval(async()=>{if(!story||document.hidden)return;try{if(!await api('story',{id}))unavailable();}catch{/* Keep the current view through a transient network failure. */}},30000);
void populate();
