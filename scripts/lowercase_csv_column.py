import csv

def lowercase_csv_column(file_path, column_name):
    rows = []
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        fieldnames = reader.fieldnames
        for row in reader:
            if column_name in row and row[column_name] is not None:
                row[column_name] = row[column_name].lower()
            rows.append(row)

    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

if __name__ == "__main__":

    lowercase_csv_column("_tmp/data/supervisors 2025-26.csv", "email")
    print(f"Column 'email' in '_tmp/data/supervisors 2025-26.csv' has been converted to lowercase.")