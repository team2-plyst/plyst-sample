package com.plyst.domain.report.repository;

import com.plyst.domain.report.entity.PlaylistReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaylistReportRepository extends JpaRepository<PlaylistReport, Long> {
}
