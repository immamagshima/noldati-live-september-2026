import assert from 'node:assert/strict';
const api='https://noldati-day4-worth.immamagshima.workers.dev/api/worth-field';
const session='qa-'+crypto.randomUUID();
const voter='qa-'+crypto.randomUUID(), second='qa-'+crypto.randomUUID();
const headers={'Content-Type':'application/json',Origin:'https://immamagshima.github.io'};
const send=async(method,body)=>fetch(api,{method,headers,body:JSON.stringify({session,...body})});
const read=async(s=session)=>(await fetch(api+'?session='+s,{headers:{Origin:headers.Origin}})).json();
try{
assert.equal((await read()).total,0);
assert.equal((await send('POST',{voter,choice:'money'})).status,200);
await send('POST',{voter,choice:'money'});assert.equal((await read()).total,1);
await send('POST',{voter:second,choice:'life'});assert.equal((await read()).total,2);
await send('POST',{voter,choice:'care'});const r=await read();assert.equal(r.counts.money,0);assert.equal(r.counts.care,1);assert.equal(r.total,2);assert.ok(!JSON.stringify(r).includes(voter));
assert.equal((await read('qa-'+crypto.randomUUID())).total,0);
assert.equal((await send('POST',{voter,choice:'invalid'})).status,400);
assert.equal((await fetch(api+'?session='+session,{headers:{Origin:'https://invalid.example'}})).status,403);
await send('DELETE',{voter});assert.equal((await read()).total,1);
console.log('PASS: persistence, idempotency, change, removal, isolation, validation, CORS, anonymous readback');
}finally{await send('DELETE',{voter});await send('DELETE',{voter:second});assert.equal((await read()).total,0);console.log('QA room empty');}
