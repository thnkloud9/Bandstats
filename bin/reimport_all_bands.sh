echo "Clearing existing collection and counters";
./clear_band_id_counter.js
./clear_bands_collection.js
echo "Starting import...this will take a while";
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=5000&maxId=5000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=10000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=15000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=20000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=25000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=30000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=35000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=40000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=45000" update
./import_bands_from_url.js -u "http://www.thedelimagazine.com/bandstats/api/bands_export.php?limit=6000&maxId=50000" update
./create_indexes.sh
./update_main_image.js -p lastfm update
