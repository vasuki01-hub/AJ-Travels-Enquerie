ALTER TABLE `travel_records` ADD `sourceEnquiryId` int;--> statement-breakpoint
ALTER TABLE `travel_records` ADD `adultCount` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `travel_records` ADD `youthCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `travel_records` ADD `childCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `travel_records` ADD `infantCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `travel_records` ADD `paymentStatus` varchar(24) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `travel_records` ADD CONSTRAINT `travel_records_source_enquiry_id_unique` UNIQUE(`sourceEnquiryId`);