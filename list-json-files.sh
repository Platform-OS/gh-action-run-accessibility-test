#!/bin/sh

SCRIPT_DIR=${1:-.}

filenames=$(find "$SCRIPT_DIR" -type f -name '*accessibility-scan-results.json' | sed 's|^.*\/app||' | sort -u)

OUTPUT_FILE=$SCRIPT_DIR/json_files.js

# Convert the filenames into a JS array
echo "const jsonFiles = [" > $OUTPUT_FILE
echo "$filenames" | awk '{print "  \"" $0 "\","}' >> $OUTPUT_FILE
# Remove the trailing comma and close the array
sed -i '$ s/,$//' $OUTPUT_FILE
echo "];" >> $OUTPUT_FILE

# Output results
echo "JS file with filenames saved to json_files.js:"
cat $OUTPUT_FILE

