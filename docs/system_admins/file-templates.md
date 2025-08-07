# File Upload Templates Guide

This guide explains the file formats required for setting up and managing the Student-Project Allocation (SPA) system instance. All files mentioned in this guide can be found in the [`docs/templates/`](https://github.com/pkitazos/spa/tree/pkitazos/amp-108-setup-the-instance-for-user-testing/docs/templates) directory as examples.

## Instance Setup: Flags Configuration

### What are Flags?

Flags are categories used to classify both students and projects in the system. They ensure that students only see projects that are appropriate for their level or program. For example, a Level 4 student should only see Level 4 projects, not Level 5 projects.

### How Flags Work

1. **Student Classification**: Each student is assigned one flag based on their program/level
2. **Project Classification**: Supervisors mark their projects with appropriate flags
3. **Matching**: Students only see projects that share at least one flag with them

### flags.json File Format

During instance setup, you'll upload a JSON file defining all flags for your allocation. Each flag must have:

- **`id`**: A unique identifier (e.g., "L4", "L5", "SEYP") - used internally by the system
- **`displayName`**: The full name shown to users (e.g., "Level 4 - Single Honours (40 credits)")
- **`description`**: Explanation for supervisors about when to use this flag

**Example flags.json:**

```json
[
  {
    "id": "L4",
    "displayName": "Level 4 - Single Honours (40 credits)",
    "description": "This marks a project suitable for Level 4 students"
  },
  {
    "id": "L5",
    "displayName": "Level 5 - Single Honours (80 credits)",
    "description": "This marks a project suitable for Level 5 students"
  }
]
```

**Important Notes:**

- Flag IDs cannot be changed after creation
- All student flags must match IDs defined in this file

## Adding Users via CSV Upload

The system supports bulk user import through CSV files. This is the recommended method for adding multiple users at once.

### Students CSV Format

**File**: `new_students.csv`

**Required Headers:**

```csv
full_name,guid,email,student_flag
```

**Field Descriptions:**

- **`full_name`**: Student's complete name as it should appear in the system
- **`guid`**: Student's unique university identifier (GUID or Matric number)
- **`email`**: Student's email address
- **`student_flag`**: Must exactly match a flag `id` from your `flags.json` file

**Example:**

```csv
full_name,guid,email,student_flag
John Smith,1234567,j.smith@student.uni.ac.uk,L4
Jane Doe,2345678,j.doe@student.uni.ac.uk,L5
Bob Johnson,3456789,b.johnson@student.uni.ac.uk,SEYP
```

### Supervisors CSV Format

**File**: `new_supervisors.csv`

**Required Headers:**

```csv
full_name,guid,email,project_target,project_upper_quota
```

**Field Descriptions:**

- **`full_name`**: Supervisor's complete name
- **`guid`**: Supervisor's unique university identifier
- **`email`**: Supervisor's email address
- **`project_target`**: Ideal number of students to supervise (used by allocation algorithm)
- **`project_upper_quota`**: Maximum number of students they can supervise

**Example:**

```csv
full_name,guid,email,project_target,project_upper_quota
Alice Brown,staff001,a.brown@uni.ac.uk,3,5
James Wilson,staff002,j.wilson@uni.ac.uk,2,4
Sarah Jones,staff003,s.jones@uni.ac.uk,4,6
```

## File Upload Best Practices

### Before Upload

1. **Validate Data**: Ensure all email addresses are correct and active
2. **Check Flags**: Verify student flags match exactly with your flags.json IDs

### Common Issues

- **Flag Mismatches**: Student flags that don't exist in flags.json will cause upload failures
- **Duplicate Emails**: Each email must be unique across the system
- **Invalid Formats**: Ensure CSV uses proper comma separation and UTF-8 encoding
- **Missing Fields**: All required columns must have values for every row

### After Upload

- Review the user list in the system to confirm all users were imported correctly
- Check that students and supervisors can log in with their credentials
- Verify that student flags are correctly assigned and visible in their profiles
