from math import ceil
from collections import defaultdict as dd

dayIndices = {'M': 0, 'T': 1, 'W': 2, 'Th': 3, 'F': 4}


courseTypes = {
    'REGULAR' : 0,
    'FIRST-HALF': 1,
    'SECOND-HALF': 2,
}

def getColumn(time):
    hours, minutes = map(int, time.split(':'))
    return (hours - 8) * 4 + ceil(minutes / 15)

def getIndices(courseTimings: str):
    ''' 
    rtype: list[list[int]]
    '''
    
    indices = []
    for dayTime in courseTimings.split(' '):
        if not dayTime: continue
        day, times = dayTime.split('=')
        for time in times.split(','):    
            startColumn, endColumn = map(getColumn, time.split('-'))
            for col in range(startColumn, endColumn):
                indices.append((dayIndices[day], col))
        
    return indices

def getCompleteTime(course):
    return getIndices(course['Course Timings'])

def fillTimeTable(course, timeTable):
    indices = getCompleteTime(course)
    for row, col in indices:
        timeTable[row][col].append([course.course_type, course.course_code])
    
    return

def checkTimeClash(course, timeTable):
    """
    rtype: Boolean
    """
    indexes = getCompleteTime(course)
    for row, col in indexes:
        if len(timeTable[row][col]) > 1 or (len(timeTable[row][col]) == 1 and timeTable[row][col][0][0] * course.course_type != 2):
            return False

    return True

def completeCourseTimings(course):
    types = ['Time', 'Time.1', 'Time.2']
    timings = dd(list)
    for type_ in types:
        if type(course[type_]) is float: continue
        for timing in course[type_].split(','):
            days, time = timing.strip().split(' ')
            for day in ['M', 'Th', 'W', 'T', 'F']:
                if day in days:
                    days = days.replace(day, '')
                    timings[day].append(time)
    
    return ' '.join(map(lambda key: key + '=' + ','.join(timings[key]), sorted(timings.keys(), key=dayIndices.get)))
        