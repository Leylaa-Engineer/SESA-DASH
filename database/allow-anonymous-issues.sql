-- Run once on an existing SESA-DASH database.
ALTER TABLE issues MODIFY reporter_email VARCHAR(254) NULL;
