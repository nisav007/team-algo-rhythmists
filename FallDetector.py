class FallDetector:
    def __init__(self, joint_names, buffer_size=10):
        self.joint_map = {name: i for i, name in enumerate(joint_names)}
        self.buffer = deque(maxlen=buffer_size)

        self.initial_height = None
        self.prev_com = None
        self.smooth_com = None

    def _get_joint(self, pose3d, name):
        return pose3d[self.joint_map[name]]

    def _compute_features(self, pose3d):
        pelvis = self._get_joint(pose3d, 'pelv')
        neck   = self._get_joint(pose3d, 'neck')

        torso_vec = neck - pelvis
        torso_norm = np.linalg.norm(torso_vec) + 1e-6
        torso_vec = torso_vec / torso_norm

        vertical = np.array([0, 1, 0])
        cos_theta = np.dot(torso_vec, vertical)

        if cos_theta < 0:
            cos_theta = -cos_theta

        height = np.max(pose3d[:, 1]) - np.min(pose3d[:, 1])

        com = np.mean(pose3d, axis=0)

        if self.smooth_com is None:
            self.smooth_com = com
        else:
            self.smooth_com = 0.7 * self.smooth_com + 0.3 * com

        velocity = 0
        delta_y = 0

        if self.prev_com is not None:
            displacement = self.smooth_com - self.prev_com
            velocity = np.linalg.norm(displacement)
            velocity = min(velocity, 100)
            delta_y = self.prev_com[1] - self.smooth_com[1]

        self.prev_com = self.smooth_com

        return {
            "cos_theta": cos_theta,
            "height": height,
            "velocity": velocity,
            "delta_y": delta_y
        }

    def detect(self, pose3d):
        features = self._compute_features(pose3d)

        if self.initial_height is None:
            self.initial_height = features["height"]

        self.buffer.append(features)

        if len(self.buffer) < 8:
            return False, features

        recent = list(self.buffer)

        heights = [f["height"] for f in recent]
        velocities = [f["velocity"] for f in recent]
        delta_ys = [f["delta_y"] for f in recent]

        velocity_flag = np.max(velocities) > 15
        drop_flag = np.sum(delta_ys) > 15
        consistent_drop = np.mean(delta_ys) > 2
        recent_height_drop = heights[0] - heights[-1]
        height_drop_flag = recent_height_drop > 80

        fall_detected = (
            velocity_flag and
            (drop_flag or consistent_drop or height_drop_flag)
        )

        return fall_detected, features