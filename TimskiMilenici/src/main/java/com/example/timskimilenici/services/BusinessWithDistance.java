package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Business;
import com.fasterxml.jackson.annotation.JsonUnwrapped;

/**
 * Wrapper around a {@link Business} adding the distance (in km) from the
 * reference point used during a nearby search. The business fields are
 * unwrapped into the JSON response so the payload looks like a regular
 * business with an extra {@code distanceKm} property.
 */
public class BusinessWithDistance {

    private final Business business;
    private final double distanceKm;

    public BusinessWithDistance(Business business, double distanceKm) {
        this.business = business;
        this.distanceKm = distanceKm;
    }

    @JsonUnwrapped
    public Business getBusiness() {
        return business;
    }

    public double getDistanceKm() {
        return distanceKm;
    }
}
