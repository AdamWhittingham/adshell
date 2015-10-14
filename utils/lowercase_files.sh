if [[ -z "$1" || "$1" == "-h" ]]; then
  echo "Usage: $0 <folder> [-d | --dirs]"
  echo "Rename all files in <folder> to have lowercase file names"
  echo "  -d or --dirs           Also lowercase directory names"
  exit 1
fi

function lowercase_filename(){
  path="$1"
  head="$( dirname $path)"
  tail="$( basename $path)"
  lowercased_tail="$( basename "$tail" | tr '[A-Z]' '[a-z]' | tr ' ' '_'  )"
  echo "$head/$lowercased_tail"
}

function move_via_tmp(){
  file="$1"
  dest="$2"
  echo "${file} -> ${dest}"
  mv "${file}" "${file}-tmp"
  mv "${file}-tmp" "${dest}"
}

find $1 -type f | while read file
do
  dest="$(lowercase_filename "$file")"
  if [ "${file}" != "${dest}" ] ; then
    move_via_tmp "${file}" "${dest}"
  fi
done

if [[ "$2" == "-d" || "$2" == '--dirs' ]] ; then
  find $1 -type d | tac | while read dir
  do
    dest="$(lowercase_filename "$dir")"
    if [ "${dir}" != "${dest}" ] ; then
      move_via_tmp "${file}" "${dest}"
    fi
  done
fi
