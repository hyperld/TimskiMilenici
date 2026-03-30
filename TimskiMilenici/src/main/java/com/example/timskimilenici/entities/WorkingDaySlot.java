package com.example.timskimilenici.entities;

import jakarta.persistence.Embeddable;

/**
 * Opening hours for a single day. Times are "HH:mm" (24h), local to the business.
 */
@Embeddable
public class WorkingDaySlot {

    private boolean enabled;
    private String openTime;
    private String closeTime;

    protected WorkingDaySlot() {}

    public WorkingDaySlot(boolean enabled, String openTime, String closeTime) {
        this.enabled = enabled;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getOpenTime() {
        return openTime;
    }

    public void setOpenTime(String openTime) {
        this.openTime = openTime;
    }

    public String getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(String closeTime) {
        this.closeTime = closeTime;
    }
}
