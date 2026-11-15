# Web workflow trial verification

Date: 15 November 2026. Isolated, in-memory synthetic trial only.

Executed 26 assertions groups in a V8 JavaScript runtime against the same reducer body embedded in the HTML. All 26 passed. Tests cover:
- independent visit to completion
- emergency stops booking
- outside pilot stops booking
- eligible synthetic nurse offered instead of closer ineligible candidate
- decline offers next nurse
- expired offers require reschedule after candidates exhausted
- no capacity requires review
- reschedule requires new dispatch
- stale and repeated acceptance rejected
- patient cannot accept offer
- no departure before assignment
- cancel clears assignment
- no routine cancellation during clinical encounter
- mandate cannot execute without order
- nurse cannot sign order
- doctor order without acknowledgement is insufficient
- revoked order blocks execution
- mandate workflow and medication delivery
- cannot execute same action twice
- cannot complete without evaluation
- pharmacy cannot create prescription
- courier cannot pick up without assignment
- pharmacy rejection cannot dispatch courier
- unknown event rejected
- missing version rejected
- original state remains unchanged

No asynchronous work, timers, network, geolocation, persistence or real patient fields in the trial. Stale version and duplicate action checks cover sequential simulation only. Browser rendering, device accessibility, live multi-user concurrency, database transactions, deadlocks and TOCTOU are not established by these checks. No actual medical decision or prescription is made. Browser role selection is explicitly a test harness, never an authorization boundary. Dispatch is a fixed synthetic candidate scenario, not PostGIS, geofence validation, live ETA or workforce matching. RME reconciliation is a simulation. Pricing, real sign-in, production data and clinical approvals are outside this trial. Node runner verification pending CI. The existing production placeholder stays unchanged.

Open the self-contained apps/web/trial/index.html in a browser or serve it with a local static server. Test patient start → Admin dispatch → nurse acceptance/travel/assessment → doctor review when required → nurse evaluation → optional pharmacy/courier sequence.
