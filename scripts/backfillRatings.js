import clientPromise from '../lib/mongodb';

async function backfill() {
  const client = await clientPromise;
  const col = client.db().collection('picks');
  const cursor = col.find({ starRating: { $exists: false } });
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const d   = doc.diff || 0;
    let r     = 1;
    if      (d >= 0.71) r = 5;
    else if (d >= 0.47) r = 4;
    else if (d >= 0.36) r = 3;
    else if (d >= 0.25) r = 2;
    await col.updateOne({ _id: doc._id }, { $set: { starRating: r } });
  }
  console.log('Backfill complete');
  process.exit();
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});
