package com.example.timskimilenici.util;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.entities.WorkingDaySlot;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.EnumMap;
import java.util.Map;

/**
 * Helpers for weekly working hours: validation, legacy defaults, and booking-time checks.
 */
public final class BusinessScheduleUtils {

    private BusinessScheduleUtils() {}

    /** Default Mon–Fri 09:00–17:00 when no schedule is stored (legacy data). */
    public static Map<DayOfWeek, WorkingDaySlot> defaultWorkingSchedule() {
        Map<DayOfWeek, WorkingDaySlot> map = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek d : DayOfWeek.values()) {
            boolean weekday = d != DayOfWeek.SATURDAY && d != DayOfWeek.SUNDAY;
            map.put(d, new WorkingDaySlot(weekday, "09:00", "17:00"));
        }
        return map;
    }

    public static Map<DayOfWeek, WorkingDaySlot> effectiveSchedule(Business business) {
        if (business == null) {
            return defaultWorkingSchedule();
        }
        Map<DayOfWeek, WorkingDaySlot> s = business.getWorkingSchedule();
        if (s == null || s.isEmpty()) {
            return defaultWorkingSchedule();
        }
        return s;
    }

    public static boolean isWorkingDay(Business business, LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        Map<DayOfWeek, WorkingDaySlot> s = effectiveSchedule(business);
        WorkingDaySlot slot = s.get(dow);
        return slot != null && slot.isEnabled();
    }

    /**
     * Whether the booking start time falls inside [open, close) for that calendar day.
     */
    public static boolean isWithinWorkingHours(Business business, LocalDateTime bookingTime) {
        if (bookingTime == null) {
            return false;
        }
        DayOfWeek dow = bookingTime.getDayOfWeek();
        Map<DayOfWeek, WorkingDaySlot> s = effectiveSchedule(business);
        WorkingDaySlot slot = s.get(dow);
        if (slot == null || !slot.isEnabled()) {
            return false;
        }
        try {
            LocalTime open = LocalTime.parse(slot.getOpenTime().trim());
            LocalTime close = LocalTime.parse(slot.getCloseTime().trim());
            LocalTime t = bookingTime.toLocalTime();
            return !t.isBefore(open) && t.isBefore(close);
        } catch (Exception e) {
            return false;
        }
    }

    /** Number of bookable start times for that day (30-minute grid, last slot starts strictly before close). */
    public static int countSlotsForDay(Business business, LocalDate date, int slotMinutes) {
        if (!isWorkingDay(business, date)) {
            return 0;
        }
        DayOfWeek dow = date.getDayOfWeek();
        WorkingDaySlot slot = effectiveSchedule(business).get(dow);
        if (slot == null || !slot.isEnabled()) {
            return 0;
        }
        try {
            LocalTime open = LocalTime.parse(slot.getOpenTime().trim());
            LocalTime close = LocalTime.parse(slot.getCloseTime().trim());
            int count = 0;
            LocalTime t = open;
            while (!t.plusMinutes(slotMinutes).isAfter(close)) {
                count++;
                t = t.plusMinutes(slotMinutes);
            }
            return count;
        } catch (Exception e) {
            return 0;
        }
    }
}
