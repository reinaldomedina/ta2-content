'use strict';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),id=params.get('id'),dev=params.get('project')==='dev';
const project=dev?'woywdpdwnnjhwcmhrdvb':'zthffofkkbdlkhpdicpm',apiRoot=`https://${project}.supabase.co/functions/v1/community`;
let story=null,position=0,timer=null,playing=false;
const photoURL=id=>`${apiRoot}/media/${encodeURIComponent(id)}`;
async function api(operation,payload){const response=await fetch(apiRoot,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,payload})});if(!response.ok)throw Error('Connection unavailable');return (await response.json()).data;}
function text(element,value){element.textContent=value??'';}
function stop(){clearTimeout(timer);timer=null;playing=false;text($('pause'),'Play');}
function unavailable(message='This story is no longer available.'){stop();if($('presentation').open)$('presentation').close();$('story').hidden=true;$('status').hidden=false;$('status').replaceChildren();const title=document.createElement('h1'),copy=document.createElement('p');title.textContent=message;copy.textContent='The author may have made it private or removed it.';$('status').append(title,copy);}
function showSlide(){
 clearTimeout(timer);const photo=story.photos[position];$('slide').src=photoURL(photo.media.id);$('slide').alt=photo.caption||`Park Story photo ${position+1}`;text($('caption'),photo.caption);text($('position'),`${position+1} / ${story.photos.length}`);$('prev').disabled=position===0;$('next').disabled=position===story.photos.length-1;
 if(playing){text($('pause'),'Pause');timer=setTimeout(()=>{if(position<story.photos.length-1){position++;showSlide();}else stop();},5000);}
}
async function populate(){
 try{
  if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id??'')){unavailable();return;}
  story=await api('story',{id});if(!story){unavailable();return;}
  $('test-label').hidden=!dev;document.title=`${story.title} · TrekAssistant`;
  text($('title'),story.title);text($('post'),story.post);text($('location'),[story.park,story.city].filter(Boolean).join(' · '));$('cover').src=photoURL(story.photos.find(p=>p.id===story.coverId).media.id);$('status').hidden=true;$('story').hidden=false;$('open-app').href=`trekassistant://community/story/${encodeURIComponent(id)}`;
  const [profile,comments,inspiration]=await Promise.all([api('publicProfile',{id:story.creatorId}),api('comments',{id}),api('inspiration',{id})]);
  text($('creator'),profile?.displayName??'Traveler');text($('avatar'),(profile?.displayName??'Traveler').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase());
  if(profile?.avatar?.id){const img=document.createElement('img');img.alt='';img.src=photoURL(profile.avatar.id);$('avatar').replaceChildren(img);}
  text($('inspired'),`⭐ ${inspiration.count} inspired`);$('comments').replaceChildren();
  const profiles=new Map([[story.creatorId,profile]]);for(const comment of comments){let creator=profiles.get(comment.creatorId);if(!creator){creator=await api('publicProfile',{id:comment.creatorId});profiles.set(comment.creatorId,creator);}const row=document.createElement('div'),name=document.createElement('strong'),body=document.createElement('p');row.className='comment';name.textContent=creator?.displayName??'Traveler';body.textContent=comment.body;row.append(name,body);$('comments').append(row);}
  text($('comments-status'),!story.allowComments?'The creator has turned comments off.':comments.length?'':'Be the first to start a conversation.');
 }catch{unavailable('This story couldn’t load.');const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=populate;$('status').append(retry);}
}
$('play').onclick=async()=>{try{const current=await api('story',{id});if(!current){unavailable();return;}story=current;position=0;playing=true;$('presentation').showModal();showSlide();}catch{text($('comments-status'),'Check your connection and try again.');}};
$('close').onclick=()=>{$('presentation').close();stop();};$('presentation').addEventListener('cancel',stop);$('slide').onerror=()=>unavailable();$('cover').onerror=()=>unavailable();
$('prev').onclick=()=>{stop();position=Math.max(0,position-1);showSlide();};$('next').onclick=()=>{stop();position=Math.min(story.photos.length-1,position+1);showSlide();};$('pause').onclick=()=>{if(playing)stop();else{playing=true;if(position===story.photos.length-1)position=0;showSlide();}};
document.addEventListener('keydown',e=>{if(!$('presentation').open)return;if(e.key==='ArrowLeft')$('prev').click();if(e.key==='ArrowRight')$('next').click();});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
$('share').onclick=async()=>{try{if(navigator.share)await navigator.share({title:story.title,url:location.href});else{await navigator.clipboard.writeText(location.href);text($('share'),'Link copied');}}catch{/* User may cancel the native share sheet. */}};
setInterval(async()=>{if(!story||document.hidden)return;try{if(!await api('story',{id}))unavailable();}catch{/* Keep the current view through a transient network failure. */}},30000);
void populate();
