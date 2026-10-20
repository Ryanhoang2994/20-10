import {createPeachGarden} from './garden.js';
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const dialog=$('wish-dialog');
let garden=null,lastFocus=null,isPaused=false,skipRequested=false,isFallback=false,toastTimer,wishIndex=0;
const wishes=[
  'Mong hôm nay có người khiến bạn mỉm cười.\nVà người đó cũng có thể là chính bạn.',
  'Chúc những điều bạn đang âm thầm cố gắng\nsớm nở thành một mùa thật đẹp.',
  'Bạn được phép nghỉ ngơi.\nDịu dàng với mình cũng là một cách mạnh mẽ.',
  'Mong bạn luôn được lắng nghe,\nđược trân trọng và được yêu thương.',
  'Chúc bạn đủ tự tin để bước tiếp,\nđủ bình yên để tận hưởng từng ngày.',
  'Không chỉ riêng ngày 20/10.\nMong mọi ngày đều có điều dịu dàng dành cho bạn.'
];
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600)}
function openWish(){
  if(dialog.open)return;lastFocus=document.activeElement;garden?.setPaused(true);dialog.showModal();
}
function closeWish(){dialog.close()}
function replay(){
  if(dialog.open)dialog.close();
  skipRequested=false;isPaused=false;
  $('pause-button').textContent='Tạm dừng';$('final-invitation').hidden=true;$('touch-hint').hidden=true;
  $('intro').hidden=false;$('pause-button').hidden=false;$('skip-button').hidden=false;$('replay-button').hidden=true;
  document.body.dataset.stage='intro';garden?.replay();
}
$('open-wish').addEventListener('click',openWish);
$('skip-button').addEventListener('click',()=>{skipRequested=true;garden?.finish();openWish()});
$('close-wish').addEventListener('click',closeWish);
$('replay-button').addEventListener('click',replay);
$('card-replay').addEventListener('click',replay);
$('pause-button').addEventListener('click',()=>{
  isPaused=!isPaused;garden?.setPaused(isPaused);$('pause-button').textContent=isPaused?'Tiếp tục':'Tạm dừng';
});
$('sparkle-button').addEventListener('click',()=>{garden?.burst();toast('Thêm một chút lấp lánh, dành cho bạn.')});
$('another-wish').addEventListener('click',()=>{
  const text=$('extra-wish');text.textContent=wishes[wishIndex++%wishes.length];
  text.classList.remove('changing');void text.offsetWidth;text.classList.add('changing');
});
dialog.addEventListener('close',()=>{
  garden?.setPaused(isPaused);
  if(lastFocus&&!lastFocus.hidden)lastFocus.focus({preventScroll:true});
});
dialog.addEventListener('click',e=>{
  if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeWish();
});
$('share-button').addEventListener('click',async()=>{
  const link=new URL(location.href);link.hash='';link.search='';
  try{
    if(navigator.share){
      await navigator.share({title:'Nở vì bạn · Chúc mừng 20/10',text:'Một mùa hoa đào và những lời thương dành cho bạn.',url:link.href});
      $('share-status').textContent='Yêu thương đã sẵn sàng để gửi đi.';
    }else{
      await navigator.clipboard.writeText(link.href);
      $('share-status').textContent='Đã sao chép link. Gửi cho người bạn muốn chúc nhé.';
    }
  }catch(error){
    if(error.name==='AbortError')return;
    $('manual-link').hidden=false;$('manual-link').value=link.href;$('manual-link').focus();$('manual-link').select();
    $('share-status').textContent='Chọn và sao chép link bên dưới để gửi nhé.';
  }
});
function setReady(){
  document.body.dataset.stage=isFallback?'fallback':'ready';
  $('intro').hidden=true;
  $('final-invitation').hidden=false;$('pause-button').hidden=true;$('skip-button').hidden=true;
  $('replay-button').hidden=reduced.matches||isFallback;$('card-replay').hidden=reduced.matches||isFallback;
  $('touch-hint').hidden=isFallback;$('sparkle-button').hidden=reduced.matches||isFallback;
  $('journey-label').textContent='Một mùa hoa, dành riêng cho bạn.';
  $('progress-fill').style.transform='scaleX(1)';$('progress-track').setAttribute('aria-valuenow','100');
  $('chapter').classList.remove('visible');
  $('scene').setAttribute('aria-label','Vùng đất hoa đào 3D đã nở. Kéo để xoay ngắm khu vườn, chạm để thêm lấp lánh.');
}
function fallback(){
  isFallback=true;$('loading').hidden=true;$('fallback').hidden=false;$('intro').hidden=true;setReady();
}
function updateProgress(p){
  if(p>0&&p<1)document.body.dataset.stage='growing';
  $('progress-fill').style.transform=`scaleX(${p})`;$('progress-track').setAttribute('aria-valuenow',String(Math.round(p*100)));
  if(p>=1)return;
  $('journey-label').textContent=p<.32?'Vùng đất nhỏ đang thức giấc':p<.76?'Từng cánh hoa đang nở vì bạn':'Gom ánh sao, gửi một lời thương';
  $('chapter').textContent=p<.6?'Một vòng dịu dàng.\nCả một trời hoa.':'Mong bạn luôn được\nnâng niu như thế.';
  $('chapter').classList.toggle('visible',p>.20&&p<.42||p>.68&&p<.86);
}
let lastMotion=reduced.matches;
function syncMotion(){
  if(lastMotion===reduced.matches)return;lastMotion=reduced.matches;
  garden?.setMotionPreference();if(['ready','fallback'].includes(document.body.dataset.stage))setReady();
}
reduced.addEventListener('change',syncMotion);
// Some embedded Chromium versions update matches before delivering change.
setInterval(syncMotion,500);
createPeachGarden({reduced,onReady:setReady,onProgress:updateProgress,onFallback:fallback,
  onTouch:()=>toast('Một chút lấp lánh vừa dành cho bạn.')}).then(result=>{
  garden=result;$('loading').hidden=true;$('pause-button').disabled=false;document.body.dataset.stage='intro';
  garden.start();if(skipRequested)garden.finish();if(dialog.open)garden.setPaused(true);
}).catch(error=>{console.warn('Chuyển sang thiệp ảnh:',error.message);fallback()});
