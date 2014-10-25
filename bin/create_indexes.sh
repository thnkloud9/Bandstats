mongo <<EOF

use bandstats

db.bands.ensureIndex({"band_id": 1});
db.bands.ensureIndex({"band_name": 1});
db.bands.ensureIndex({"external_ids.facebook_id": 1});
db.bands.ensureIndex({"external_ids.lastfm_id": 1});
db.bands.ensureIndex({"created": 1});
db.bands.ensureIndex({"last_updated": 1});

EOF
