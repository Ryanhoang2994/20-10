import {createPhotographicGarden} from './garden.js';
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const dialog=$('wish-dialog');
let garden=null,lastFocus=null,isPaused=false,readyTimer,skipRequested=false;

function openWish(){
  clearTimeout(readyTimer);
  if(dialog.open)return;
  lastFocus=document.activeElement;
  garden?.setPaused(true);
  dialog.showModal();
}
function closeWish(){dialog.close()}
$('open-wish').addEventListener('click',openWish);
$('skip-button').addEventListener('click',()=>{
  skipRequested=true;garden?.finish();openWish();
});
$('close-wish').addEventListener('click',closeWish);
dialog.addEventListener('close',()=>{
  garden?.setPaused(isPaused);
  if(lastFocus&&!lastFocus.hidden)lastFocus.focus({preventScroll:true});
});
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeWish();
});
$('pause-button').addEventListener('click',()=>{
  isPaused=!isPaused;
  garden?.setPaused(isPaused);
  $('pause-button').textContent=isPaused?'Tiếp tục':'Tạm dừng';
});
$('replay-button').addEventListener('click',()=>{
  clearTimeout(readyTimer);skipRequested=false;isPaused=false;
  $('pause-button').textContent='Tạm dừng';
  $('intro').hidden=false;$('final-invitation').hidden=true;
  $('pause-button').hidden=false;$('skip-button').hidden=false;$('replay-button').hidden=true;
  document.body.dataset.stage='intro';
  $('scene').setAttribute('aria-label','Cánh đồng hoa đang mọc lên dưới ánh hoàng hôn.');
  garden?.replay();
});
$('share-button').addEventListener('click',async()=>{
  const link=new URL(location.href);link.hash='';link.search='';
  try{
    if(navigator.share){
      await navigator.share({title:'Nở vì bạn · Chúc mừng 20/10',text:'Một cánh đồng hoa và một lời chúc dành cho bạn.',url:link.href});
      $('share-status').textContent='Yêu thương đã sẵn sàng để gửi đi.';
    }else{
      await navigator.clipboard.writeText(link.href);
      $('share-status').textContent='Đã sao chép link. Bạn có thể gửi qua Zalo hoặc Messenger.';
    }
  }catch(error){
    if(error.name==='AbortError')return;
    $('manual-link').hidden=false;$('manual-link').value=link.href;
    $('manual-link').focus();$('manual-link').select();
    $('share-status').textContent='Chọn và sao chép link bên dưới để gửi nhé.';
  }
});
function setReady(){
  document.body.dataset.stage='ready';
  $('final-invitation').hidden=false;
  $('pause-button').hidden=true;$('skip-button').hidden=true;
  $('replay-button').hidden=reduced.matches;
  $('journey-label').textContent='Cả một cánh đồng, dành tặng bạn.';
  $('progress-fill').style.transform='scaleX(1)';
  $('progress-track').setAttribute('aria-valuenow','100');
  $('chapter').classList.remove('visible');
  $('scene').setAttribute('aria-label','Cánh đồng hoa vàng, cam và hồng đã nở dưới ánh hoàng hôn.');
  clearTimeout(readyTimer);
  if(!dialog.open)readyTimer=setTimeout(openWish,reduced.matches?150:1800);
}
function fallback(){
  clearTimeout(readyTimer);
  $('loading').hidden=true;$('fallback').hidden=false;$('intro').hidden=true;
  setReady();document.body.dataset.stage='fallback';$('replay-button').hidden=true;
}
function updateProgress(progress){
  if(progress>0&&progress<1)document.body.dataset.stage='growing';
  $('progress-fill').style.transform=`scaleX(${progress})`;
  $('progress-track').setAttribute('aria-valuenow',String(Math.round(progress*100)));
  if(progress>=1)return;
  $('journey-label').textContent=progress<.3?'Từng mầm xanh đang thức giấc':progress<.72?'Một cánh đồng đang nở vì bạn':'Gom chút nắng, gửi chút thương';
  const chapter=$('chapter');
  chapter.textContent=progress<.58?'Một chút nắng. Một chút dịu dàng.':'Và thật nhiều yêu thương, dành cho bạn.';
  chapter.classList.toggle('visible',progress>.22&&progress<.42||progress>.66&&progress<.83);
}
let lastMotionPreference=reduced.matches;
function syncMotionPreference(){
  if(lastMotionPreference===reduced.matches)return;
  lastMotionPreference=reduced.matches;
  garden?.setMotionPreference();
  if(document.body.dataset.stage==='ready')$('replay-button').hidden=reduced.matches;
}
reduced.addEventListener('change',syncMotionPreference);
// Embedded Chromium can update matches before delivering its change event.
setInterval(syncMotionPreference,500);
createPhotographicGarden({reduced,onReady:setReady,onProgress:updateProgress,onFallback:fallback}).then(result=>{
  garden=result;
  $('loading').hidden=true;$('pause-button').disabled=false;document.body.dataset.stage='intro';
  garden.start();
  if(skipRequested)garden.finish();
  if(dialog.open)garden.setPaused(true);
}).catch(error=>{
  console.warn('Cảnh hoa chuyển sang ảnh dự phòng:',error.message);fallback();
});
