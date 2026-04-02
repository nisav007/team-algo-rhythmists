import os
import cv2
import tensorflow_hub as tfhub
import numpy as np
from collections import deque
import gradio as gr
import FallDetector

print("Loading model...")
model = tfhub.load('https://bit.ly/metrabs_l')
skeleton = 'smpl_24'
joint_names = model.per_skeleton_joint_names[skeleton].numpy().astype(str)


def match_detections(prev_coms, current_coms, max_dist=80):
    matches = {}
    used_prev = set()

    for i, curr in enumerate(current_coms):
        best_id = None
        best_dist = float('inf')

        for pid, prev in prev_coms.items():
            if pid in used_prev:
                continue

            dist = np.linalg.norm(curr - prev)

            if dist < best_dist and dist < max_dist:
                best_dist = dist
                best_id = pid

        if best_id is not None:
            matches[i] = best_id
            used_prev.add(best_id)

    return matches


def process_video(video_path):
    cap = cv2.VideoCapture(video_path)

    detectors = {}
    prev_coms = {}
    next_person_id = 0

    frame_count = 0
    MAX_FRAMES = 200

    fall_detected_global = False

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1

        if frame_count > MAX_FRAMES:
            break

        if frame_count % 3 != 0:
            continue

        image = tf.image.resize(frame, (256, 256))
        image = tf.cast(image, tf.uint8)

        try:
            pred = model.detect_poses(
                image,
                default_fov_degrees=55,
                skeleton=skeleton
            )
        except:
            continue

        pred = tf.nest.map_structure(lambda x: x.numpy(), pred)
        poses3d = pred.get('poses3d', [])

        if len(poses3d) == 0:
            continue

        current_coms = [np.mean(p, axis=0) for p in poses3d]
        matches = match_detections(prev_coms, current_coms)

        new_prev_coms = {}

        for i, pose3d in enumerate(poses3d):

            if i in matches:
                person_id = matches[i]
            else:
                person_id = next_person_id
                detectors[person_id] = FallDetector(joint_names)
                next_person_id += 1

            detector = detectors[person_id]

            fall, _ = detector.detect(pose3d)

            if fall:
                fall_detected_global = True

            new_prev_coms[person_id] = current_coms[i]

        prev_coms = new_prev_coms

    cap.release()

    if fall_detected_global:
        return "Fall Detected in Video"
    else:
        return "No Fall Detected"

interface = gr.Interface(
    fn=process_video,
    inputs=gr.Video(label="Upload Video"),
    outputs=gr.Textbox(label="Result"),
    title="Fall Detection System",
    description="Upload a video to check if a fall occurred."
)

interface.launch()