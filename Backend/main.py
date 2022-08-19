import json
import pandas as pd
import numpy as np

from flask import Flask, request, jsonify
from flask_cors import CORS

from helpers import *

app = Flask(__name__)
CORS(app)

df = None
instanceDb = None
myTimeTable = None
myCourses = None
branch = None
currCredits = 0
customColumns = [
    "credits",
    "course_code",
    "slot_name",
    # "course_type",
    "Venue",
    "Venue.1",
    "Venue.2",
    "Time",
    "Time.1",
    "Time.2",
    "Slot Name/Course Type",
]




def setup_instance():
    global myTimeTable, myCourses, instanceDb, currCredits
    instanceDb = pd.DataFrame(df)
    myCourses = []
    myTimeTable = [[[] for _ in range(4 * (20 - 8))] for _ in range(5)]
    currCredits = 0


def setup_app():
    global df
    df = pd.read_html("./df.html", index_col=["S.No."])[0]
    df["credits"] = df.Credits.apply(lambda x: int(x.split("(")[1][:-1]))
    df["course_code"] = df["Course Name/Group Name"].str.extract(
        r"([A-Z]{2,3}\d{2,3}\w?)"
    )
    df["slot_name"] = df["Slot Name/Course Type"].apply(lambda x: x.split(" ")[0])
    df["course_type"] = df["Slot Name/Course Type"].apply(lambda x: courseTypes[x.split("/")[-1].strip()])
    df['Course Timings'] = df.apply(completeCourseTimings, axis=1)

    setup_instance()


@app.route("/")
def index():
    setup_app()
    return jsonify(list(df.Br.unique())), 200


@app.route("/set-branch", methods=["GET"])
def set_branch():
    global branch
    branch = request.args.get("branch")
    return "ok"


@app.route("/get-my-course-timings", methods=["GET"])
def get_time_table():
    global myCourses
    courses = []
    for course in myCourses:
        info = df[df.course_code == course].iloc[0][['course_code', 'Course Timings', 'course_type']].to_list()
        courses.append({
            'name': info[0],
            'timings': info[1],
            'type': int(info[2])
        })
    
    return jsonify(courses)



@app.route("/get-table", methods=["GET"])
def get_table():
    global branch
    offeredAs = request.args.get("offered-as")
    filt = instanceDb.index < 0
    if "DE" in offeredAs or "DC" in offeredAs:
        if not branch:
            return "Please select a branch.", 400
        temp = []
        if "DE" in offeredAs:
            temp.append("DE")
        if "DC" in offeredAs:
            temp.append("DC")
        filt = filt | ((instanceDb.Br == branch) & (
            instanceDb["Slot Name/Course Type"].str.contains("|".join(temp)))
        )
    

    if "OE" in offeredAs:
        filt = filt | (instanceDb["Slot Name/Course Type"].str.contains("OE"))

    if "IC" in offeredAs:
        filt = filt | (instanceDb["Slot Name/Course Type"].str.contains("IC"))

    if "SO" in offeredAs:
        filt = filt | (
            instanceDb.course_code.str.contains("SO")
            & ~instanceDb.course_code.str.contains("SOC")
        )

    if "HSS1" in offeredAs:
        filt = filt | (
            ((instanceDb.Br == "HSS") | (instanceDb.Br == "ECO"))
            & instanceDb["Slot Name/Course Type"].str.contains("HSS I ")
        )

    if "HSS2" in offeredAs:
        filt = filt | (
            ((instanceDb.Br == "HSS") | (instanceDb.Br == "ECO"))
            & instanceDb["Slot Name/Course Type"].str.contains("HSS II")
        )

    if "UGP" in offeredAs:
        filt = filt | (
            (instanceDb.Br == branch)
            & (instanceDb["Slot Name/Course Type"].str.contains("UGP"))
        )

    matkaCourses = json.loads(request.args.get("matka-courses"))
    if matkaCourses:
        filt = filt & ~(
            (instanceDb.credits == 0)
            & (instanceDb["Course Name/Group Name"].str.contains("THESIS|SEMINAR"))
        )
    else:
        filt = filt | ((instanceDb.Br == branch) & (instanceDb.credits == 0))
    
    

    practicalCourses = request.args.get("practical-courses")
    if practicalCourses == "exclude":
        filt = filt & (instanceDb["Time.2"].isna())
    elif practicalCourses == "only":
        filt = filt & ~(instanceDb["Time.2"].isna())

    filt = filt & (instanceDb.credits < 65 - currCredits)

    return (
        instanceDb.loc[filt, ~instanceDb.columns.isin(customColumns)]
        .reset_index(drop=True)
        .to_html()
    )


@app.route("/search-courses", methods=["GET"])
def search_courses():
    inp = request.args.get("input")
    if not inp:
        return {}
    filt = df["Course Name/Group Name"].str.contains(inp)
    courses = (
        df.loc[filt, ["course_code", "Course Name/Group Name", "credits"]]
        .head(5)
        .to_json(orient="index")
    )
    return courses


@app.route("/add-courses", methods=["POST"])
def addCourse():
    global myCourses, myTimeTable, instanceDb, currCredits
    setup_instance()
    myCourses = request.json
    for myCourse in myCourses:
        course = df[df.course_code == myCourse].iloc[0]
        fillTimeTable(course, myTimeTable)
        currCredits += course.credits
    instanceDb = instanceDb[
        instanceDb.apply(lambda x: checkTimeClash(x, myTimeTable), axis=1)
    ]
    return "ok", 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)