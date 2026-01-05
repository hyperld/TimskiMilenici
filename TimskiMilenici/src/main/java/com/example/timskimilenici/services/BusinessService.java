package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.repositories.BusinessRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BusinessService {

    private final BusinessRepository businessRepository;

    public BusinessService(BusinessRepository businessRepository) {
        this.businessRepository = businessRepository;
    }

    public List<Business> getAllBusinesses() {
        return businessRepository.findAll();
    }

    public Optional<Business> getBusinessById(Long id) {
        return businessRepository.findById(id);
    }

    public Business saveBusiness(Business business) {
        return businessRepository.save(business);
    }

    public List<Business> findByCategory(String category) {
        return businessRepository.findByCategory(category);
    }

    public List<Business> searchByLocation(String location) {
        return businessRepository.findByLocationContainingIgnoreCase(location);
    }
}
