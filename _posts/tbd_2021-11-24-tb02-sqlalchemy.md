sqlalchemy sql query

cluster*item = self.db.query(Cluster)\
 .filter((Cluster.userid.is*(None)) & (Cluster.domain.is\_(None)))\
 .order_by(Cluster.id).first()
print(cluster_item)

NULL 조회시

userid is None 으로 하면 안됨.
== None
혹은
userid.is\_(None)
userid.isnot(None)

이렇게 해야함 .

그리고 두개 연속 none 비교할때

userid.is*(None) and domain.is*(None)

으로 묶으면 안됨.
.filter((Cluster.userid.is*(None)) & (Cluster.domain.is*(None)))
이런식으로 구분해줘야함.

상세한 답변
https://veluxer62.github.io/explanation/sqlalchemy-filter-is-null
