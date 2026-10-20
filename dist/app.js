import {createCosmosGarden} from './garden.js';
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const dialog=$('wish-dialog');
let garden=null,lastFocus=null,isFallback=false,toastTimer,wishIndex=0;
const wishes=[
  'Mong hôm nay có người khiến em mỉm cười.\nVà người đó cũng có thể là chính em.',
  'Chúc những điều em đang âm thầm cố gắng\nsớm nở thành một mùa thật đẹp.',
  'Em được phép nghỉ ngơi.\nDịu dàng với mình cũng là một cách mạnh mẽ.',
  'Mong em luôn được lắng nghe,\nđược trân trọng và được yêu thương.',
  'Chúc em đủ tự tin để bước tiếp,\nđủ bình yên để tận hưởng từng ngày.',
  'Không chỉ riêng ngày 20/10.\nMong mọi ngày đều có điều dịu dàng dành cho em.'
];
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600)}
function openWish(){
  if(dialog.open)return;lastFocus=document.activeElement;garden?.setPaused(true);dialog.showModal();
}
function closeWish(){dialog.close()}
function replay(){
  if(dialog.open)dialog.close();
  $('final-invitation').hidden=true;$('intro').hidden=false;
  document.body.dataset.stage='intro';garden?.replay();
}
$('open-wish').addEventListener('click',openWish);
$('close-wish').addEventListener('click',closeWish);
$('card-replay').addEventListener('click',replay);
$('sparkle-button').addEventListener('click',()=>{garden?.burst();toast('Thêm một chút lấp lánh, dành cho em.')});
$('another-wish').addEventListener('click',()=>{
  const text=$('extra-wish');text.textContent=wishes[wishIndex++%wishes.length];
  text.classList.remove('changing');void text.offsetWidth;text.classList.add('changing');
});
dialog.addEventListener('close',()=>{
  garden?.setPaused(false);
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
      await navigator.share({title:'Nở vì em · Chúc mừng 20/10',text:'Một mùa hoa cosmos và những lời thương dành cho em.',url:link.href});
      $('share-status').textContent='Yêu thương đã sẵn sàng để gửi đi.';
    }else{
      await navigator.clipboard.writeText(link.href);
      $('share-status').textContent='Đã sao chép link. Gửi chút yêu thương này đi nhé.';
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
  $('final-invitation').hidden=false;
  $('card-replay').hidden=reduced.matches||isFallback;
  $('sparkle-button').hidden=reduced.matches||isFallback;
  $('chapter').classList.remove('visible');
  $('scene').setAttribute('aria-label','Cánh đồng hoa cosmos hồng đã nở. Kéo để xoay ngắm khu vườn, chạm để thêm lấp lánh.');
}
function fallback(){
  isFallback=true;$('loading').hidden=true;$('fallback').hidden=false;$('intro').hidden=true;setReady();
}
function updateProgress(p){
  if(p>0&&p<1)document.body.dataset.stage='growing';
  if(p>=1)return;
  $('chapter').textContent=p<.6?'Một vòng dịu dàng.\nCả một trời hoa.':'Mong em luôn được\nnâng niu như thế.';
  $('chapter').classList.remove('visible');
}
let lastMotion=reduced.matches;
function syncMotion(){
  if(lastMotion===reduced.matches)return;lastMotion=reduced.matches;
  garden?.setMotionPreference();if(['ready','fallback'].includes(document.body.dataset.stage))setReady();
}
reduced.addEventListener('change',syncMotion);
// Some embedded Chromium versions update matches before delivering change.
setInterval(syncMotion,500);
createCosmosGarden({reduced,onReady:setReady,onProgress:updateProgress,onFallback:fallback,
  onTouch:()=>toast('Một chút lấp lánh vừa dành cho em.')}).then(result=>{
  garden=result;$('loading').hidden=true;document.body.dataset.stage='intro';
  garden.start();if(dialog.open)garden.setPaused(true);
}).catch(error=>{console.warn('Chuyển sang thiệp ảnh:',error.message);fallback()});
