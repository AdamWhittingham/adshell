#! /bin/bash

in_meeting=100

function detect_zoom_meeting() {
  ps -ef | grep -Eq 'zoom.*\-key [0-9]+'
}

function report_state_change() {
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  if [[ $1 == 0 ]]; then
    echo "${now}: In meeting"
    in_meeting $1
  else
    echo "${now}: Out of meetings"
    out_of_meeting $1
  fi
}

function in_meeting() {
  if [[ -ne $ZOOM_STATUS_WEBOOK_URL ]] ; then
    curl -x POST -d '{"zoom_status": "in_meeting"}' $ZOOM_STATUS_WEBOOK_URL
  fi
}

function out_of_meeting() {
  if [[ -ne $ZOOM_STATUS_WEBOOK_URL ]] ; then
    curl -x POST -d '{"zoom_status": "out_of_meeting"}' $ZOOM_STATUS_WEBOOK_URL
  fi
}


while true; do
  detect_zoom_meeting
  new_state=$?

  if [[ new_state -ne in_meeting ]] ; then
    report_state_change $new_state
  fi

  in_meeting=$new_state
  sleep 1
done
