/** Strict, fail-closed normalization of read-only reservation availability feeds. */
export const FACILITIES = ['deepstation', 'paradive'];
export const VALID_STATUSES = ['available','limited','full','unknown'];
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const CLOCK=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
export function formatKST(date=new Date()){
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get = key => parts.find(p=>p.type===key)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addDays(iso,n){
  const date = new Date(`${iso}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+n);
  return date.toISOString().slice(0,10);
}
export function normalizeFeed(raw, facility, seenAt=new Date()){
  if (!FACILITIES.includes(facility)) throw new Error('Unknown provider');
  if(!raw || typeof raw!=='object' || !Array.isArray(raw.slots)) throw new Error('Expected an object with a slots array');
  const observed=new Date(seenAt);
  if (raw.updatedAt !== undefined){
    const updated=new Date(raw.updatedAt);
    if (!Number.isFinite(updated.getTime()) || updated.getTime()>observed.getTime()+60_000 || observed.getTime()-updated.getTime()>20*60_000) {
      throw new Error('Provider snapshot is missing a fresh updatedAt timestamp');
    }
  }
  if(raw.slots.length>2000)throw new Error('Excessive feed size');
  const slots=[];
  for(const rawSlot of raw.slots){
    if(!rawSlot || typeof rawSlot!=='object')continue;
    const {date,start,end='',status='unknown'}=rawSlot;
    if(typeof date!=='string'||!DATE.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`))||typeof start!=='string'||!CLOCK.test(start)||!VALID_STATUSES.includes(status))continue;
    if(end!=='' && (typeof end!=='string'||!CLOCK.test(end)))continue;
    const remaining=(typeof rawSlot.remaining==='number'&&Number.isInteger(rawSlot.remaining)&&rawSlot.remaining>=0)?rawSlot.remaining:null;
    const total=(typeof rawSlot.total==='number'&&Number.isInteger(rawSlot.total)&&rawSlot.total>=0)?rawSlot.total:null;
    // Fail closed: a zero remaining count cannot be published as available.
    const safeStatus=remaining===0?'full':status;
    slots.push({facility,date,start,end,name:String(rawSlot.name||'예약 회차').slice(0,70),category:String(rawSlot.category||'일반 입장').slice(0,70),status:safeStatus,remaining,total});
  }
  return slots;
}
export function emptyFeed(now=new Date()){
  return {updatedAt:now.toISOString(),displayTimezone:'Asia/Seoul',sources:{
    deepstation:{connected:false,state:'not_configured'},paradive:{connected:false,state:'not_configured'}
  },slots:[]};
}
