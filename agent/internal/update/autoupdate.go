package update

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/sirupsen/logrus"
)

type UpdateChecker struct {
	currentVersion string
	updateURL      string
	log            *logrus.Logger
	client         *http.Client
	checkInterval  time.Duration
}

type ReleaseInfo struct {
	Version     string `json:"version"`
	DownloadURL string `json:"download_url"`
	Checksum    string `json:"checksum"`
	Mandatory   bool   `json:"mandatory"`
	Changelog   string `json:"changelog"`
}

func NewUpdateChecker(currentVersion, updateURL string, log *logrus.Logger) *UpdateChecker {
	return &UpdateChecker{
		currentVersion: currentVersion,
		updateURL:      updateURL,
		log:            log,
		client:         &http.Client{Timeout: 30 * time.Second},
		checkInterval:  24 * time.Hour,
	}
}

func (u *UpdateChecker) Start() {
	go func() {
		u.checkForUpdates()
		ticker := time.NewTicker(u.checkInterval)
		defer ticker.Stop()

		for range ticker.C {
			u.checkForUpdates()
		}
	}()
}

func (u *UpdateChecker) checkForUpdates() {
	u.log.Debug("Checking for updates...")

	req, err := http.NewRequest("GET", u.updateURL+"/api/v1/agent/updates/latest", nil)
	if err != nil {
		u.log.WithError(err).Warn("Failed to create update request")
		return
	}
	req.Header.Set("X-Agent-Version", u.currentVersion)
	req.Header.Set("X-Agent-OS", runtime.GOOS)
	req.Header.Set("X-Agent-Arch", runtime.GOARCH)

	resp, err := u.client.Do(req)
	if err != nil {
		u.log.WithError(err).Debug("Update check failed (offline?)")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		u.log.Debug("No updates available")
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		u.log.WithError(err).Warn("Failed to read update response")
		return
	}

	var release ReleaseInfo
	if err := json.Unmarshal(body, &release); err != nil {
		u.log.WithError(err).Warn("Failed to parse release info")
		return
	}

	u.log.WithFields(logrus.Fields{
		"current": u.currentVersion,
		"latest":  release.Version,
	}).Info("Update available")

	if release.Mandatory {
		u.performUpdate(release)
	}
}

func (u *UpdateChecker) performUpdate(release ReleaseInfo) error {
	u.log.WithField("version", release.Version).Info("Downloading update...")

	resp, err := u.client.Get(release.DownloadURL)
	if err != nil {
		return fmt.Errorf("failed to download update: %w", err)
	}
	defer resp.Body.Close()

	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	tmpPath := filepath.Join(os.TempDir(), "sistema-agent-update")
	f, err := os.Create(tmpPath)
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}

	if _, err := io.Copy(f, resp.Body); err != nil {
		f.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("failed to write update: %w", err)
	}
	f.Close()

	if err := os.Chmod(tmpPath, 0755); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to chmod update: %w", err)
	}

	u.log.Info("Update downloaded, replacing binary...")
	if err := os.Rename(tmpPath, execPath); err != nil {
		return fmt.Errorf("failed to replace binary: %w", err)
	}

	u.log.Info("Restarting to apply update...")
	cmd := exec.Command(execPath, os.Args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to restart: %w", err)
	}

	os.Exit(0)
	return nil
}
